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
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-athlete-chat',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="flex flex-col h-[calc(100vh-220px)] md:h-[calc(100vh-100px)]">
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
                @if (msg.content) {
                  <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                }
                @if (msg.attachments.length > 0) {
                  <div class="mt-1 space-y-1.5">
                    @for (att of msg.attachments; track att.storedName) {
                      @if (isImage(att.mimeType)) {
                        <a [href]="getFileUrl(att.storedName)" target="_blank" class="block">
                          <img
                            [src]="getFileUrl(att.storedName)"
                            [alt]="att.originalName"
                            class="max-h-48 rounded-lg cursor-pointer" />
                        </a>
                      } @else {
                        <a
                          [href]="getFileUrl(att.storedName)"
                          target="_blank"
                          [class]="msg.senderId === currentUserId()
                            ? 'flex items-center gap-1.5 text-sm text-white/90 hover:text-white underline'
                            : 'flex items-center gap-1.5 text-sm text-accent-500 hover:text-accent-600 underline'">
                          <span>📎</span>
                          <span class="truncate max-w-[200px]">{{ att.originalName }}</span>
                        </a>
                      }
                    }
                  </div>
                }
                <p [class]="msg.senderId === currentUserId()
                  ? 'text-xs text-white/70 mt-1'
                  : 'text-xs text-primary-300 mt-1'">
                  {{ timeAgo(msg.createdAt) }}
                </p>
              </div>
            </div>
          }
        </div>

        <!-- File preview -->
        @if (selectedFiles().length > 0) {
          <div class="flex flex-wrap gap-2 px-2 py-2 border-t border-primary-100">
            @for (file of selectedFiles(); track $index) {
              <div class="flex items-center gap-1 bg-primary-50 rounded-lg px-2 py-1 text-xs text-primary-600">
                <span class="truncate max-w-[150px]">{{ file.name }}</span>
                <button (click)="removeFile($index)" class="text-primary-400 hover:text-red-500 font-bold ml-1">×</button>
              </div>
            }
          </div>
        }

        <!-- Input -->
        <div class="flex gap-2 pt-3 border-t border-primary-100">
          <input
            #fileInput
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
            class="hidden"
            (change)="onFilesSelected($event)" />
          <button
            (click)="fileInput.click()"
            [disabled]="selectedFiles().length >= 3"
            class="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Adjuntar archivo">
            📎
          </button>
          <input
            [(ngModel)]="newMessage"
            (keydown.enter)="send()"
            placeholder="Escribí un mensaje..."
            class="flex-1 rounded-lg border border-primary-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400" />
          <button
            (click)="send()"
            [disabled]="!canSend()"
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
  private toast = inject(ToastService);

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
  selectedFiles = signal<File[]>([]);

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
        error: () => {
          this.toast.error('Error al cargar mensajes');
          this.loading.set(false);
        },
      });
  }

  loadMore() {
    this.skip += this.limit;
    this.loadMessages();
  }

  canSend(): boolean {
    return this.newMessage.trim().length > 0 || this.selectedFiles().length > 0;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const current = this.selectedFiles();
    const remaining = 3 - current.length;
    const newFiles = Array.from(input.files).slice(0, remaining);
    this.selectedFiles.set([...current, ...newFiles]);
    input.value = '';
  }

  removeFile(index: number) {
    this.selectedFiles.set(this.selectedFiles().filter((_, i) => i !== index));
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  getFileUrl(storedName: string): string {
    return this.messagesService.getFileUrl(storedName);
  }

  send() {
    const content = this.newMessage.trim();
    const files = this.selectedFiles();
    if (!content && files.length === 0) return;

    const formData = new FormData();
    formData.append('receiverId', this.coachId);
    if (content) {
      formData.append('content', content);
    }
    files.forEach((f) => formData.append('files', f));

    this.newMessage = '';
    this.selectedFiles.set([]);

    this.messagesService.sendMessage(formData).subscribe({
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
        error: () => {},
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
