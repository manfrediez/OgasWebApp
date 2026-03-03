import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../../../services/messages.service';
import { UsersService } from '../../../services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { Message } from '../../../models/message.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-athlete-chat',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="flex flex-col h-[calc(100vh-160px)] md:h-[calc(100vh-100px)]">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4">
        <div class="h-9 w-9 rounded-full bg-accent-400 flex items-center justify-center text-white font-bold text-sm">
          {{ coachName() ? coachName()![0] : '' }}
        </div>
        <h1 class="text-xl font-bold text-primary-700">{{ coachName() }}</h1>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!coachId) {
        <div class="flex flex-col items-center justify-center py-12 text-primary-400">
          <span class="text-4xl mb-3">💬</span>
          <p class="text-lg font-medium">No tenés un coach asignado</p>
        </div>
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
export class AthleteChatComponent implements OnInit, OnDestroy {
  private messagesService = inject(MessagesService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  private scrollContainer = viewChild<ElementRef>('scrollContainer');
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private skip = 0;
  private readonly limit = 30;

  coachId = '';
  messages = signal<Message[]>([]);
  displayMessages = signal<Message[]>([]);
  coachName = signal<string>('');
  loading = signal(true);
  hasMore = signal(true);
  newMessage = '';

  currentUserId = signal('');

  ngOnInit() {
    const user = this.authService.currentUser();
    this.currentUserId.set(user?._id || '');
    this.coachId = user?.coachId || '';

    if (!this.coachId) {
      this.loading.set(false);
      return;
    }

    this.usersService.getById(this.coachId).subscribe({
      next: (coach) => {
        this.coachName.set(`${coach.firstName} ${coach.lastName}`);
      },
    });

    this.loadMessages(true);
    this.messagesService.markAsRead(this.coachId).subscribe();

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
      .getConversation(this.coachId, this.limit, this.skip)
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
      .sendMessage({ receiverId: this.coachId, content })
      .subscribe({
        next: (msg) => {
          this.messages.set([...this.messages(), msg]);
          this.displayMessages.set(this.messages());
          this.scrollToBottom();
        },
      });
  }

  private pollNewMessages() {
    this.messagesService
      .getConversation(this.coachId, this.limit, 0)
      .subscribe({
        next: (msgs) => {
          const reversed = [...msgs].reverse();
          const currentIds = new Set(this.messages().map((m) => m._id));
          const newMsgs = reversed.filter((m) => !currentIds.has(m._id));
          if (newMsgs.length > 0) {
            this.messages.set([...this.messages(), ...newMsgs]);
            this.displayMessages.set(this.messages());
            this.scrollToBottom();
            this.messagesService.markAsRead(this.coachId).subscribe();
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
