import { Component, inject, signal, OnInit } from '@angular/core';
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
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/coach/info" class="text-primary-400 hover:text-primary-700">
          <span class="text-xl">←</span>
        </a>
        <h1 class="text-2xl font-bold text-primary-700 flex-1">{{ topicName() }}</h1>
        <button
          (click)="openForm()"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Nueva publicación
        </button>
      </div>

      <!-- Form -->
      @if (showForm()) {
        <div class="bg-surface rounded-xl p-5 shadow-sm border border-primary-100 mb-6">
          <h3 class="text-sm font-semibold text-primary-700 mb-4">
            {{ editingPost() ? 'Editar publicación' : 'Nueva publicación' }}
          </h3>
          <form (ngSubmit)="savePost()" class="space-y-4">
            <div>
              <input
                [(ngModel)]="formTitle"
                name="title"
                type="text"
                maxlength="200"
                placeholder="Título"
                class="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                required />
            </div>
            <div>
              <textarea
                [(ngModel)]="formContent"
                name="content"
                maxlength="10000"
                placeholder="Contenido"
                rows="6"
                class="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                required></textarea>
            </div>

            <!-- Existing attachments (edit mode) -->
            @if (editingPost() && existingAttachments().length > 0) {
              <div>
                <p class="text-xs font-medium text-primary-500 mb-2">Archivos existentes</p>
                <div class="flex flex-wrap gap-2">
                  @for (att of existingAttachments(); track att.storedName) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-600">
                      {{ att.originalName }}
                      <button
                        type="button"
                        (click)="removeExistingAttachment(att.storedName)"
                        class="ml-1 text-primary-400 hover:text-danger-500 font-bold">
                        ×
                      </button>
                    </span>
                  }
                </div>
              </div>
            }

            <!-- File input -->
            <div>
              <label class="block text-xs font-medium text-primary-500 mb-1">
                Adjuntar archivos (max 5, 10MB c/u)
              </label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                (change)="onFilesSelected($event)"
                class="text-sm text-primary-500" />
            </div>

            <div class="flex justify-end gap-3">
              <button
                type="button"
                (click)="cancelForm()"
                class="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-surface-alt">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
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
            <div class="bg-surface rounded-xl p-5 shadow-sm border border-primary-50">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-semibold text-primary-700">{{ post.title }}</h3>
                <span class="text-xs text-primary-400 shrink-0 ml-3">{{ post.createdAt | dateEs:'d MMM yyyy' }}</span>
              </div>
              <p class="text-sm text-primary-500 whitespace-pre-line mb-3">{{ post.content | slice:0:500 }}{{ post.content.length > 500 ? '...' : '' }}</p>

              @if (post.attachments.length > 0) {
                <div class="flex flex-wrap gap-2 mb-3">
                  @for (att of post.attachments; track att.storedName) {
                    <a
                      [href]="infoService.getFileUrl(att.storedName)"
                      target="_blank"
                      class="inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-600 hover:bg-accent-500/20">
                      {{ getFileIcon(att.mimeType) }} {{ att.originalName }}
                    </a>
                  }
                </div>
              }

              <div class="flex gap-3">
                <button
                  (click)="openForm(post)"
                  class="text-xs text-primary-400 hover:text-accent-500 font-medium">
                  Editar
                </button>
                <button
                  (click)="confirmDelete(post)"
                  class="text-xs text-primary-400 hover:text-danger-500 font-medium">
                  Eliminar
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
    this.infoService.getTopics().subscribe((topics) => {
      const topic = topics.find((t) => t._id === this.topicId);
      if (topic) this.topicName.set(topic.name);
    });
  }

  loadPosts() {
    this.infoService.getPostsByTopic(this.topicId).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar publicaciones');
        this.loading.set(false);
      },
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
