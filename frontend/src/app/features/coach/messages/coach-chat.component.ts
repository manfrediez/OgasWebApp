import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../../../services/messages.service';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { Message } from '../../../models/message.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-coach-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="flex flex-col h-[calc(100vh-100px)]">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <a routerLink="/coach/messages" class="text-primary-400 hover:text-primary-700 text-xl">←</a>
        <div class="h-9 w-9 rounded-full bg-accent-400 flex items-center justify-center text-white font-bold text-sm">
          {{ athleteName() ? athleteName()![0] : '' }}
        </div>
        <h1 class="text-xl font-bold text-primary-700">{{ athleteName() }}</h1>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <!-- Messages -->
        <div #scrollContainer class="flex-1 overflow-y-auto space-y-3 pb-4">
          @if (hasMore()) {
            <button
              (click)="loadMore()"
              class="w-full text-center text-sm text-accent-500 hover:text-accent-600 py-2">
              Cargar anteriores
            </button>
          }
          @for (msg of displayMessages(); track msg._id) {
            <div [class]="msg.senderId === currentUserId() ? 'flex justify-end' : 'flex justify-start'">
              <div [class]="msg.senderId === currentUserId()
                ? 'bg-accent-400 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[75%]'
                : 'card-glass-static text-primary-700 rounded-2xl rounded-bl-md px-4 py-2 max-w-[75%]'">
                <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                <p [class]="msg.senderId === currentUserId()
                  ? 'text-xs text-white/70 mt-1'
                  : 'text-xs text-primary-300 mt-1'">
                  {{ timeAgo(msg.createdAt) }}
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Input -->
        <div class="flex gap-2 pt-3 border-t border-primary-100">
          <input
            [(ngModel)]="newMessage"
            (keydown.enter)="send()"
            placeholder="Escribí un mensaje..."
            class="flex-1 rounded-lg border border-primary-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400" />
          <button
            (click)="send()"
            [disabled]="!newMessage.trim()"
            class="rounded-lg bg-accent-500 px-5 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Enviar
          </button>
        </div>
      }
    </div>
  `,
})
export class CoachChatComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private messagesService = inject(MessagesService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  private scrollContainer = viewChild<ElementRef>('scrollContainer');
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private athleteId = '';
  private skip = 0;
  private readonly limit = 30;

  messages = signal<Message[]>([]);
  displayMessages = signal<Message[]>([]);
  athleteName = signal<string>('');
  loading = signal(true);
  hasMore = signal(true);
  newMessage = '';

  currentUserId = signal('');

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUserId.set(user?._id || '');
    this.athleteId = this.route.snapshot.params['athleteId'];

    this.usersService.getAthletes().subscribe({
      next: (athletes) => {
        const athlete = athletes.find((a) => a._id === this.athleteId);
        if (athlete) {
          this.athleteName.set(`${athlete.firstName} ${athlete.lastName}`);
        }
      },
    });

    this.loadMessages(true);
    this.messagesService.markAsRead(this.athleteId).subscribe();

    this.pollingInterval = setInterval(() => {
      this.pollNewMessages();
    }, 15000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadMessages(initial = false) {
    this.messagesService
      .getConversation(this.athleteId, this.limit, this.skip)
      .subscribe({
        next: (msgs) => {
          if (msgs.length < this.limit) {
            this.hasMore.set(false);
          }
          const reversed = [...msgs].reverse();
          if (initial) {
            this.messages.set(reversed);
          } else {
            this.messages.set([...reversed, ...this.messages()]);
          }
          this.displayMessages.set(this.messages());
          this.loading.set(false);
          if (initial) {
            this.scrollToBottom();
          }
        },
        error: () => this.loading.set(false),
      });
  }

  loadMore() {
    this.skip += this.limit;
    this.loadMessages();
  }

  send() {
    const content = this.newMessage.trim();
    if (!content) return;
    this.newMessage = '';
    this.messagesService
      .sendMessage({ receiverId: this.athleteId, content })
      .subscribe({
        next: (msg) => {
          this.messages.set([...this.messages(), msg]);
          this.displayMessages.set(this.messages());
          this.scrollToBottom();
        },
        error: () => this.toast.error('Error al enviar mensaje'),
      });
  }

  private pollNewMessages() {
    this.messagesService
      .getConversation(this.athleteId, this.limit, 0)
      .subscribe({
        next: (msgs) => {
          const reversed = [...msgs].reverse();
          const currentIds = new Set(this.messages().map((m) => m._id));
          const newMsgs = reversed.filter((m) => !currentIds.has(m._id));
          if (newMsgs.length > 0) {
            this.messages.set([...this.messages(), ...newMsgs]);
            this.displayMessages.set(this.messages());
            this.scrollToBottom();
            this.messagesService.markAsRead(this.athleteId).subscribe();
          }
        },
      });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollContainer()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  timeAgo(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  }
}
