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
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-primary-700">Info General</h1>
        <button
          (click)="openForm()"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Nuevo tema
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-100 mb-6">
          <h3 class="text-sm font-semibold text-primary-700 mb-3">
            {{ editingTopic() ? 'Editar tema' : 'Nuevo tema' }}
          </h3>
          <form (ngSubmit)="saveTopic()" class="flex gap-3">
            <input
              [(ngModel)]="formName"
              name="name"
              type="text"
              maxlength="100"
              placeholder="Nombre del tema"
              class="flex-1 rounded-lg border border-primary-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              required />
            <button
              type="submit"
              [disabled]="saving()"
              class="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50">
              {{ saving() ? 'Guardando...' : 'Guardar' }}
            </button>
            <button
              type="button"
              (click)="cancelForm()"
              class="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-surface-alt">
              Cancelar
            </button>
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
            <div class="bg-surface rounded-xl p-5 shadow-sm border border-primary-50 hover:shadow-md transition-shadow">
              <a [routerLink]="['/coach/info', topic._id]" class="block mb-3">
                <h3 class="font-semibold text-primary-700 text-lg">{{ topic.name }}</h3>
                <p class="text-sm text-primary-400 mt-1">
                  {{ topic.postCount }} {{ topic.postCount === 1 ? 'publicación' : 'publicaciones' }}
                </p>
              </a>
              <div class="flex gap-2">
                <button
                  (click)="openForm(topic)"
                  class="text-xs text-primary-400 hover:text-accent-500 font-medium">
                  Editar
                </button>
                <button
                  (click)="confirmDelete(topic)"
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
