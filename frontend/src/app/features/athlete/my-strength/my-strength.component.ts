import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { WorkoutPlansService } from '../../../services/workout-plans.service';
import { StrengthCircuitsService } from '../../../services/strength-circuits.service';
import { StrengthCircuit } from '../../../models/strength-circuit.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-strength',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (circuits().length === 0) {
      <app-empty-state icon="💪" message="Sin circuitos de fuerza" submessage="Tu coach asignará rutinas de fuerza a tu plan" />
    } @else {
      <div>
        <h1 class="text-xl font-bold text-primary-700 mb-4">Mis Circuitos de Fuerza</h1>

        <div class="space-y-4">
          @for (circuit of circuits(); track circuit._id) {
            <div class="card-glass rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-primary-700">
                  Circuito {{ circuit.circuitNumber }}: {{ circuit.name }}
                </h3>
                @if (circuit.routineNumber) {
                  <span class="text-xs bg-accent-400/10 text-accent-700 rounded-full px-2 py-0.5">
                    Rutina {{ circuit.routineNumber }}
                  </span>
                }
              </div>

              @if (circuit.timerFormat) {
                <p class="text-sm text-primary-400 mb-3">⏱️ {{ circuit.timerFormat }}</p>
              }

              @if (circuit.exercises.length > 0) {
                <div class="space-y-1">
                  @for (ex of circuit.exercises; track $index; let i = $index) {
                    <div class="flex items-center justify-between bg-primary-50 rounded-lg px-3 py-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-primary-400 w-5">{{ i + 1 }}.</span>
                        <span class="text-sm font-medium text-primary-700">{{ ex.name }}</span>
                        @if (ex.videoUrl) {
                          <a [href]="ex.videoUrl" target="_blank" rel="noopener"
                             class="text-danger-500 hover:text-danger-700" title="Ver video">
                            ▶
                          </a>
                        }
                      </div>
                      <div class="flex items-center gap-3 text-xs text-primary-400">
                        @if (ex.sets && ex.reps) {
                          <span>{{ ex.sets }} x {{ ex.reps }}</span>
                        }
                        @if (ex.timerWork) {
                          <span>{{ ex.timerWork }}s
                            @if (ex.timerRest) { / {{ ex.timerRest }}s desc }
                          </span>
                        }
                        @if (ex.notes) {
                          <span class="italic">{{ ex.notes }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class MyStrengthComponent implements OnInit {
  private authService = inject(AuthService);
  private plansService = inject(WorkoutPlansService);
  private circuitsService = inject(StrengthCircuitsService);
  private destroyRef = inject(DestroyRef);

  circuits = signal<StrengthCircuit[]>([]);
  loading = signal(true);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    // Get athlete's plans to find strength routines
    this.plansService.getByAthlete(user._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: plans => {
        if (plans.length > 0 && plans[0].strengthRoutines && plans[0].strengthRoutines.length > 0) {
          // Load circuits for the most recent plan
          this.circuitsService.getByPlan(plans[0]._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: c => {
              this.circuits.set(c);
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
