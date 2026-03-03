import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { GeneralInfoService } from '../../../services/general-info.service';
import { Topic } from '../../../models/general-info.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-coach-info-topics',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div>
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-primary-800 tracking-tight">Info General</h1>
            <p class="text-primary-400 text-sm mt-1">Compartí información y recursos con tus atletas</p>
          </div>
          <button
            (click)="openForm()"
            class="btn-primary flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nuevo tema
          </button>
        </div>
      </div>

      <!-- Inline Form -->
      @if (showForm()) {
        <div class="card-glass rounded-2xl p-5 mb-6 border-l-4 border-accent-500">
          <h3 class="text-sm font-semibold text-primary-700 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
            </svg>
            {{ editingTopic() ? 'Editar tema' : 'Nuevo tema' }}
          </h3>
          <form (ngSubmit)="saveTopic()" class="flex flex-col sm:flex-row gap-3">
            <input
              [(ngModel)]="formName"
              name="name"
              type="text"
              maxlength="100"
              placeholder="Nombre del tema"
              class="flex-1 rounded-xl border border-primary-200 px-4 py-2.5 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:outline-none transition-colors"
              required />
            <div class="flex gap-2">
              <button
                type="submit"
                [disabled]="saving()"
                class="btn-primary disabled:opacity-50">
                {{ saving() ? 'Guardando...' : 'Guardar' }}
              </button>
              <button
                type="button"
                (click)="cancelForm()"
                class="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <app-loading-spinner />
      } @else if (topics().length === 0) {
        <app-empty-state
          icon="📚"
          message="No hay temas creados"
          submessage="Creá tu primer tema para compartir información con tus atletas" />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (topic of topics(); track topic._id) {
            <div class="card-glass rounded-2xl p-5 border-l-4 border-accent-500 hover:shadow-lg transition-all duration-200 group">
              <a [routerLink]="['/coach/info', topic._id]" class="block mb-3">
                <div class="flex items-start gap-3">
                  <div class="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-semibold text-primary-700 text-lg group-hover:text-accent-600 transition-colors truncate">{{ topic.name }}</h3>
                    <span class="inline-flex items-center gap-1 mt-1.5 rounded-full bg-accent-500/10 px-2.5 py-0.5 text-xs font-medium text-accent-600">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                      </svg>
                      {{ topic.postCount }} {{ topic.postCount === 1 ? 'publicación' : 'publicaciones' }}
                    </span>
                  </div>
                </div>
              </a>
              <div class="flex gap-1 justify-end">
                <button
                  (click)="openForm(topic)"
                  class="p-1.5 rounded-lg text-primary-400 hover:text-accent-500 hover:bg-accent-500/10 transition-colors"
                  title="Editar">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                  </svg>
                </button>
                <button
                  (click)="confirmDelete(topic)"
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
export class CoachInfoTopicsComponent implements OnInit {
  private infoService = inject(GeneralInfoService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);

  topics = signal<Topic[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  editingTopic = signal<Topic | null>(null);
  formName = '';

  ngOnInit() {
    this.loadTopics();
  }

  loadTopics() {
    this.infoService.getTopics().subscribe({
      next: (topics) => {
        this.topics.set(topics);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar temas');
        this.loading.set(false);
      },
    });
  }

  openForm(topic?: Topic) {
    if (topic) {
      this.editingTopic.set(topic);
      this.formName = topic.name;
    } else {
      this.editingTopic.set(null);
      this.formName = '';
    }
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingTopic.set(null);
    this.formName = '';
  }

  saveTopic() {
    if (!this.formName.trim()) return;
    this.saving.set(true);

    const editing = this.editingTopic();
    const obs = editing
      ? this.infoService.updateTopic(editing._id, { name: this.formName.trim() })
      : this.infoService.createTopic(this.formName.trim());

    obs.subscribe({
      next: () => {
        this.toast.success(editing ? 'Tema actualizado' : 'Tema creado');
        this.cancelForm();
        this.saving.set(false);
        this.loadTopics();
      },
      error: () => {
        this.toast.error('Error al guardar el tema');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(topic: Topic) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar tema',
        message: `Se eliminará "${topic.name}" y todas sus publicaciones y archivos adjuntos. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
      },
      panelClass: 'dialog-panel',
    });

    ref.closed.subscribe((confirmed) => {
      if (confirmed) {
        this.infoService.deleteTopic(topic._id).subscribe({
          next: () => { this.toast.success('Tema eliminado'); this.loadTopics(); },
          error: () => this.toast.error('Error al eliminar tema'),
        });
      }
    });
  }
}
