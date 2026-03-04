import { Component, inject, input, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { StrengthCircuitsService } from '../../../../../services/strength-circuits.service';
import { StrengthCircuit } from '../../../../../models/strength-circuit.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { StrengthCircuitFormComponent } from '../../../forms/strength-circuit-form/strength-circuit-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-strength-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, ErrorStateComponent],
  template: `
    <div>
      <div class="flex justify-end mb-4">
        <button
          (click)="openForm()"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Nuevo Circuito
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (errorState()) {
        <app-error-state (retry)="loadCircuits()" />
      } @else if (circuits().length === 0) {
        <app-empty-state icon="💪" message="Sin circuitos" submessage="Creá un circuito de fuerza"
          actionLabel="Nuevo Circuito" (actionClick)="openForm()" />
      } @else {
        <div class="space-y-3">
          @for (circuit of circuits(); track circuit._id) {
            <div class="card-glass rounded-xl p-4">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-primary-700">
                    Circuito {{ circuit.circuitNumber }}: {{ circuit.name }}
                  </h3>
                  @if (circuit.timerFormat) {
                    <p class="text-xs text-primary-400 mt-1">⏱️ {{ circuit.timerFormat }}</p>
                  }
                  @if (circuit.routineNumber) {
                    <p class="text-xs text-primary-400">Rutina #{{ circuit.routineNumber }}</p>
                  }
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="openForm(circuit)"
                    title="Editar"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-accent-500 hover:bg-accent-400/10 transition-colors">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  <button
                    (click)="confirmDelete(circuit)"
                    [disabled]="deleting() === circuit._id"
                    title="Eliminar"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors disabled:opacity-50">
                    @if (deleting() === circuit._id) {
                      <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    } @else {
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              @if (circuit.exercises.length > 0) {
                <div class="mt-3 space-y-1">
                  @for (ex of circuit.exercises; track $index) {
                    <div class="flex items-center justify-between text-sm bg-primary-50 rounded px-3 py-1.5">
                      <span class="text-primary-600">
                        {{ ex.name }}
                        @if (ex.videoUrl) {
                          <a [href]="ex.videoUrl" target="_blank" rel="noopener"
                             class="text-danger-500 hover:text-danger-700 ml-1" title="Ver video">▶</a>
                        }
                      </span>
                      <span class="text-primary-400 text-xs">
                        @if (ex.sets && ex.reps) {
                          {{ ex.sets }}x{{ ex.reps }}
                        } @else if (ex.timerWork) {
                          {{ ex.timerWork }}s
                          @if (ex.timerRest) { / {{ ex.timerRest }}s desc }
                        }
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class StrengthTabComponent implements OnInit {
  private circuitsService = inject(StrengthCircuitsService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  athleteId = input.required<string>();
  circuits = signal<StrengthCircuit[]>([]);
  loading = signal(true);
  errorState = signal(false);
  deleting = signal<string | null>(null);

  ngOnInit() {
    this.loadCircuits();
  }

  loadCircuits() {
    this.loading.set(true);
    this.errorState.set(false);
    this.circuitsService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: c => {
        this.circuits.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.loading.set(false);
      },
    });
  }

  openForm(circuit?: StrengthCircuit) {
    const ref = this.dialog.open(StrengthCircuitFormComponent, {
      data: { circuit },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(result => {
      if (result) this.loadCircuits();
    });
  }

  confirmDelete(circuit: StrengthCircuit) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar circuito',
        message: `¿Estás seguro de eliminar "${circuit.name}"?`,
        confirmText: 'Eliminar',
        variant: 'danger',
      } as ConfirmDialogData,
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(confirmed => {
      if (confirmed) {
        this.deleting.set(circuit._id);
        this.circuitsService.delete(circuit._id).subscribe({
          next: () => { this.deleting.set(null); this.toast.success('Circuito eliminado'); this.loadCircuits(); },
          error: () => { this.deleting.set(null); this.toast.error('Error al eliminar circuito'); },
        });
      }
    });
  }
}
