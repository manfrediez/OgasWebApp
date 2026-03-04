import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../../../services/messages.service';
import { ConversationSummary } from '../../../models/message.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-coach-conversations',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-primary-700 mb-6">Mensajes</h1>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (conversations().length === 0) {
        <app-empty-state
          icon="💬"
          message="No tenés atletas aún"
          submessage="Invitá a tu primer atleta para comenzar a chatear" />
      } @else {
        <!-- Search -->
        <div class="mb-4">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              [(ngModel)]="searchTerm"
              placeholder="Buscar conversación..."
              class="pl-9 pr-3 py-2 rounded-lg border border-primary-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 w-full sm:w-64" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (conv of filteredConversations(); track conv.athleteId) {
            <a
              [routerLink]="['/coach/messages', conv.athleteId]"
              class="card-glass rounded-xl p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-accent-400 flex items-center justify-center text-white font-bold shrink-0">
                  {{ conv.firstName[0] }}{{ conv.lastName[0] }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <h3 class="font-semibold text-primary-700 truncate">{{ conv.firstName }} {{ conv.lastName }}</h3>
                    @if (conv.unreadCount > 0) {
                      <span class="shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent-500 text-white text-xs font-bold">
                        {{ conv.unreadCount }}
                      </span>
                    }
                  </div>
                  @if (conv.lastMessage) {
                    <p class="text-sm text-primary-400 truncate mt-0.5">{{ conv.lastMessage }}</p>
                    <p class="text-xs text-primary-300 mt-0.5">{{ timeAgo(conv.lastMessageAt!) }}</p>
                  } @else if (conv.lastMessageAttachmentCount > 0) {
                    <p class="text-sm text-primary-400 italic truncate mt-0.5">📎 Archivo adjunto</p>
                    <p class="text-xs text-primary-300 mt-0.5">{{ timeAgo(conv.lastMessageAt!) }}</p>
                  } @else {
                    <p class="text-sm text-primary-300 italic mt-0.5">Sin mensajes</p>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class CoachConversationsComponent implements OnInit {
  private messagesService = inject(MessagesService);
  private destroyRef = inject(DestroyRef);

  conversations = signal<ConversationSummary[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  filteredConversations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const convs = [...this.conversations()].sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    if (!term) return convs;
    return convs.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.messagesService.getConversations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (convs) => {
        this.conversations.set(convs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  timeAgo(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
  }
}
