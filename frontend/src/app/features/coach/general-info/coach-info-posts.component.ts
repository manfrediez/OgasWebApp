import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SlicePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { GeneralInfoService } from '../../../services/general-info.service';
import { InfoPost, Attachment } from '../../../models/general-info.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-coach-info-posts',
  standalone: true,
  imports: [SlicePipe, RouterLink, FormsModule, LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div>
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <a routerLink="/coach/info" class="p-2 rounded-xl text-primary-400 hover:text-primary-700 hover:bg-primary-500/10 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-primary-700 truncate">{{ topicName() }}</h1>
          <span class="inline-flex items-center gap-1 mt-1 rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-600">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
            </svg>
            {{ posts().length }} {{ posts().length === 1 ? 'publicación' : 'publicaciones' }}
          </span>
        </div>
        <button
          (click)="openForm()"
          class="rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600 transition-colors flex items-center gap-2 shrink-0">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nueva publicación
        </button>
      </div>

      <!-- Form -->
      @if (showForm()) {
        <div class="card-glass rounded-2xl p-5 mb-6 border-l-4 border-accent-500">
          <h3 class="text-sm font-semibold text-primary-700 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
            </svg>
            {{ editingPost() ? 'Editar publicación' : 'Nueva publicación' }}
          </h3>
          <form (ngSubmit)="savePost()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-primary-500 mb-1.5">Título</label>
              <input
                [(ngModel)]="formTitle"
                name="title"
                type="text"
                maxlength="200"
                placeholder="Título de la publicación"
                class="w-full rounded-xl border border-primary-200 px-4 py-2.5 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none transition-colors"
                required />
            </div>
            <div>
              <label class="block text-xs font-medium text-primary-500 mb-1.5">Contenido</label>
              <textarea
                [(ngModel)]="formContent"
                name="content"
                maxlength="10000"
                placeholder="Escribí el contenido de la publicación..."
                rows="6"
                class="w-full rounded-xl border border-primary-200 px-4 py-2.5 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none transition-colors"
                required></textarea>
            </div>

            <!-- Existing attachments (edit mode) -->
            @if (editingPost() && existingAttachments().length > 0) {
              <div>
                <p class="text-xs font-medium text-primary-500 mb-2">Archivos existentes</p>
                <div class="flex flex-wrap gap-2">
                  @for (att of existingAttachments(); track att.storedName) {
                    <span class="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-1.5 text-xs text-primary-600">
                      <svg class="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/>
                      </svg>
                      {{ att.originalName }}
                      <button
                        type="button"
                        (click)="removeExistingAttachment(att.storedName)"
                        class="ml-0.5 p-0.5 rounded text-primary-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </span>
                  }
                </div>
              </div>
            }

            <!-- File input -->
            <div>
              <label class="block text-xs font-medium text-primary-500 mb-1.5">
                Adjuntar archivos (max 5, 10MB c/u)
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                (change)="onFilesSelected($event)"
                class="text-sm text-primary-500 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-500/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent-600 hover:file:bg-accent-500/20" />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                (click)="cancelForm()"
                class="btn-secondary">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="btn-primary disabled:opacity-50">
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <app-loading-spinner />
      } @else if (posts().length === 0 && !showForm()) {
        <app-empty-state
          icon="📝"
          message="No hay publicaciones"
          submessage="Creá la primera publicación en este tema" />
      } @else {
        <div class="space-y-4">
          @for (post of posts(); track post._id) {
            <div class="card-glass rounded-2xl p-5 border-l-4 border-accent-500 hover:shadow-lg transition-shadow">
              <div class="flex items-start justify-between mb-3">
                <h3 class="font-semibold text-primary-700 text-lg">{{ post.title }}</h3>
                <span class="inline-flex items-center gap-1.5 text-xs text-primary-400 shrink-0 ml-3 bg-primary-50 rounded-full px-2.5 py-0.5">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
                  </svg>
                  {{ post.createdAt | dateEs:'d MMM yyyy' }}
                </span>
              </div>
              <div class="relative mb-3">
                <p class="text-sm text-primary-500 whitespace-pre-line">{{ post.content | slice:0:500 }}</p>
                @if (post.content.length > 500) {
                  <div class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                }
              </div>

              @if (post.attachments.length > 0) {
                <div class="flex flex-wrap gap-2 mb-3">
                  @for (att of post.attachments; track att.storedName) {
                    <a
                      [href]="infoService.getFileUrl(att.storedName)"
                      target="_blank"
                      class="inline-flex items-center gap-2 rounded-xl bg-accent-500/10 px-3.5 py-1.5 text-xs font-medium text-accent-600 hover:bg-accent-500/20 transition-colors">
                      @if (att.mimeType.startsWith('image/')) {
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 0 0 2.25-2.25V5.25a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 3.75 21Z"/>
                        </svg>
                      } @else if (att.mimeType === 'application/pdf') {
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                        </svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/>
                        </svg>
                      }
                      {{ att.originalName }}
                    </a>
                  }
                </div>
              }

              <div class="flex gap-1 pt-2 border-t border-primary-50">
                <button
                  (click)="openForm(post)"
                  class="p-1.5 rounded-lg text-primary-400 hover:text-accent-500 hover:bg-accent-500/10 transition-colors"
                  title="Editar">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                  </svg>
                </button>
                <button
                  (click)="confirmDelete(post)"
                  class="p-1.5 rounded-lg text-primary-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors"
                  title="Eliminar">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CoachInfoPostsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  infoService = inject(GeneralInfoService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  topicId = '';
  topicName = signal('');
  posts = signal<InfoPost[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingPost = signal<InfoPost | null>(null);
  existingAttachments = signal<Attachment[]>([]);
  removedAttachments: string[] = [];

  formTitle = '';
  formContent = '';
  selectedFiles: File[] = [];

  ngOnInit() {
    this.topicId = this.route.snapshot.params['topicId'];
    this.loadPosts();
    this.infoService.getTopics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((topics) => {
      const topic = topics.find((t) => t._id === this.topicId);
      if (topic) this.topicName.set(topic.name);
    });
  }

  loadPosts() {
    this.infoService.getPostsByTopic(this.topicId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(post?: InfoPost) {
    if (post) {
      this.editingPost.set(post);
      this.formTitle = post.title;
      this.formContent = post.content;
      this.existingAttachments.set([...post.attachments]);
    } else {
      this.editingPost.set(null);
      this.formTitle = '';
      this.formContent = '';
      this.existingAttachments.set([]);
    }
    this.removedAttachments = [];
    this.selectedFiles = [];
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingPost.set(null);
    this.formTitle = '';
    this.formContent = '';
    this.existingAttachments.set([]);
    this.removedAttachments = [];
    this.selectedFiles = [];
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  removeExistingAttachment(storedName: string) {
    this.removedAttachments.push(storedName);
    this.existingAttachments.update((atts) => atts.filter((a) => a.storedName !== storedName));
  }

  savePost() {
    if (!this.formTitle.trim() || !this.formContent.trim()) return;
    this.saving.set(true);

    const fd = new FormData();
    fd.append('title', this.formTitle.trim());
    fd.append('content', this.formContent.trim());

    const editing = this.editingPost();

    if (!editing) {
      fd.append('topicId', this.topicId);
    }

    for (const name of this.removedAttachments) {
      fd.append('removeAttachments[]', name);
    }
    for (const file of this.selectedFiles) {
      fd.append('files', file);
    }

    const obs = editing
      ? this.infoService.updatePost(editing._id, fd)
      : this.infoService.createPost(fd);

    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Publicación actualizada' : 'Publicación creada');
        this.cancelForm();
        this.saving.set(false);
        this.loadPosts();
      },
      error: () => {
        this.toast.error('Error al guardar la publicación');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(post: InfoPost) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar publicación',
        message: `Se eliminará "${post.title}" y todos sus archivos adjuntos.`,
        confirmText: 'Eliminar',
      },
      panelClass: 'dialog-panel',
    });

    ref.closed.subscribe((confirmed) => {
      if (confirmed) {
        this.infoService.deletePost(post._id).subscribe({
          next: () => { this.toast.success('Publicación eliminada'); this.loadPosts(); },
          error: () => this.toast.error('Error al eliminar publicación'),
        });
      }
    });
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  }
}
