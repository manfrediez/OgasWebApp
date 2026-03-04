import { Component, inject, input, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkoutPlansService } from '../../../../../services/workout-plans.service';
import { PlanSummary, WeekStats } from '../../../../../models/workout-plan.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-summary-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (summaries().length === 0) {
      <app-empty-state icon="📊" message="Sin datos" submessage="No hay planes para mostrar estadísticas" />
    } @else {
      <div class="space-y-6">
        @for (plan of summaries(); track plan.planId) {
          <div class="card-glass rounded-xl p-5">
            <!-- Plan header -->
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold text-primary-700">{{ plan.planName }}</h3>
                <p class="text-xs text-primary-400">
                  {{ plan.startDate | dateEs }} - {{ plan.endDate | dateEs }}
                  @if (plan.planNumber) {
                    · Meso #{{ plan.planNumber }}
                  }
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold" [class]="getCompletionColor(plan.overallCompletionPct)">
                  {{ plan.overallCompletionPct }}%
                </p>
                <p class="text-xs text-primary-400">cumplimiento</p>
              </div>
            </div>

            <!-- Week stats -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (week of plan.weekStats; track week.weekNumber) {
                <div class="bg-primary-50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-primary-600">Semana {{ week.weekNumber }}</span>
                    <span class="text-sm font-bold" [class]="getCompletionColor(week.completionPct)">
                      {{ week.completionPct }}%
                    </span>
                  </div>

                  <!-- Progress bar -->
                  <div class="h-2 bg-primary-50 rounded-full overflow-hidden mb-2">
                    <div
                      class="h-full rounded-full transition-all"
                      [class]="getBarColor(week.completionPct)"
                      [style.width.%]="week.completionPct">
                    </div>
                  </div>

                  <!-- Details row -->
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-primary-400">
                    <span>{{ week.completed }}/{{ week.planned }} sesiones</span>
                    @if (week.skipped > 0) {
                      <span class="text-amber-600 dark:text-amber-400">{{ week.skipped }} omitida{{ week.skipped > 1 ? 's' : '' }}</span>
                    }
                    @if (week.avgRpe !== null) {
                      <span>RPE prom: <span class="font-semibold" [class]="getRpeColor(week.avgRpe!)">{{ week.avgRpe }}</span></span>
                    }
                  </div>
                  <div class="flex gap-x-4 text-xs text-primary-400 mt-1">
                    @if (week.totalDuration > 0) {
                      <span>{{ week.totalDuration }} min</span>
                    }
                    @if (week.totalDistance > 0) {
                      <span>{{ week.totalDistance }} km</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class SummaryTabComponent implements OnInit {
  private plansService = inject(WorkoutPlansService);
  private destroyRef = inject(DestroyRef);

  athleteId = input.required<string>();
  summaries = signal<PlanSummary[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.plansService.getAthleteSummary(this.athleteId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.summaries.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getCompletionColor(pct: number): string {
    if (pct >= 75) return 'text-green-700 dark:text-green-400';
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-primary-400';
  }

  getBarColor(pct: number): string {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-400';
    return 'bg-primary-300';
  }

  getRpeColor(rpe: number): string {
    if (rpe <= 3) return 'text-green-700 dark:text-green-400';
    if (rpe <= 6) return 'text-yellow-700 dark:text-yellow-400';
    if (rpe <= 8) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }
}
