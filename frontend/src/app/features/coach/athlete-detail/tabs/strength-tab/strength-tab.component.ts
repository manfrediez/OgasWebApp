import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { StrengthCircuitsService } from '../../../../../services/strength-circuits.service';
import { StrengthCircuit } from '../../../../../models/strength-circuit.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { StrengthCircuitFormComponent } from '../../../forms/strength-circuit-form/strength-circuit-form.component';

@Component({
  selector: 'app-strength-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent],
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
      } @else if (circuits().length === 0) {
        <app-empty-state icon="💪" message="Sin circuitos" submessage="Creá un circuito de fuerza" />
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
                <button (click)="openForm(circuit)" class="text-xs text-accent-500 hover:text-accent-700">Editar</button>
              </div>

              @if (circuit.exercises.length > 0) {
                <div class="mt-3 space-y-1">
                  @for (ex of circuit.exercises; track $index) {
                    <div class="flex items-center justify-between text-sm bg-white/30 rounded px-3 py-1.5">
                      <span class="text-primary-600">{{ ex.name }}</span>
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

  athleteId = input.required<string>();
  circuits = signal<StrengthCircuit[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadCircuits();
  }

  loadCircuits() {
    this.circuitsService.getAll().subscribe({
      next: c => {
        this.circuits.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(circuit?: StrengthCircuit) {
    const ref = this.dialog.open(StrengthCircuitFormComponent, {
      data: { circuit },
      panelClass: 'flex items-center justify-center p-4',
    });
    ref.closed.subscribe(result => {
      if (result) this.loadCircuits();
    });
  }
}
