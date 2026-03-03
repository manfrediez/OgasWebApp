import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { WorkoutPlansService } from '../../../services/workout-plans.service';
import { ActivityDataService } from '../../../services/activity-data.service';
import { WorkoutPlan, Week, Session, UpdateSessionFeedbackRequest } from '../../../models/workout-plan.model';
import { ActivityData } from '../../../models/activity-data.model';
import { SessionStatus } from '../../../core/models/enums';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { WeekViewComponent } from './week-view/week-view.component';
import { SessionFeedbackDialogComponent } from './session-feedback-dialog/session-feedback-dialog.component';

@Component({
  selector: 'app-my-plan',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, WeekViewComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (plans().length === 0) {
      <app-empty-state icon="📋" message="No tenés planes asignados" submessage="Tu coach te asignará un plan pronto" />
    } @else {
      <div>
        <!-- Plan selector -->
        @if (plans().length > 1) {
          <div class="mb-4">
            <select
              [value]="selectedPlanIdx()"
              (change)="selectPlan(+$any($event.target).value)"
              class="w-full md:w-auto">
              @for (plan of plans(); track plan._id; let i = $index) {
                <option [value]="i">{{ plan.name }}</option>
              }
            </select>
          </div>
        }

        @if (selectedPlan(); as plan) {
          <h1 class="text-xl font-bold text-primary-700 mb-1">{{ plan.name }}</h1>
          @if (plan.sport) {
            <p class="text-sm text-primary-400 mb-4">{{ plan.sport }}</p>
          }

          <!-- Week tabs -->
          <div class="flex gap-2 mb-4 overflow-x-auto">
            @for (week of plan.weeks; track week.weekNumber) {
              <button
                (click)="selectedWeek.set(week.weekNumber)"
                [class]="selectedWeek() === week.weekNumber
                  ? 'rounded-lg bg-primary-500 px-3 md:px-4 py-2 text-sm font-medium text-white'
                  : 'rounded-lg bg-surface px-3 md:px-4 py-2 text-sm font-medium text-primary-500 hover:bg-surface-alt'">
                <span>Semana {{ week.weekNumber }}</span>
                @if (weekTotal(week) > 0) {
                  <span class="ml-1 md:ml-1.5 text-xs opacity-80">
                    {{ weekCompleted(week) }}/{{ weekTotal(week) }}
                    <span class="hidden md:inline">({{ weekPercent(week) }}%)</span>
                  </span>
                }
              </button>
            }
          </div>

          <!-- Week content -->
          @if (currentWeek(); as week) {
            <app-week-view
              [week]="week"
              [activityDataMap]="activityDataMap()"
              [planId]="plan._id"
              (sessionClick)="openFeedback($event)" />
          }

          <!-- Activation protocol -->
          @if (plan.activationProtocol) {
            <div class="mt-6 bg-surface rounded-xl p-4 shadow-sm">
              <h3 class="text-sm font-semibold text-primary-600 mb-2">Protocolo de Activación</h3>
              <p class="text-sm text-primary-500 whitespace-pre-wrap">{{ plan.activationProtocol }}</p>
            </div>
          }

          <!-- General notes -->
          @if (plan.generalNotes && plan.generalNotes.length > 0) {
            <div class="mt-4 bg-surface rounded-xl p-4 shadow-sm">
              <h3 class="text-sm font-semibold text-primary-600 mb-2">Notas Generales</h3>
              @for (note of plan.generalNotes; track $index) {
                <p class="text-sm text-primary-500">• {{ note }}</p>
              }
            </div>
          }
        }
      </div>
    }
  `,
})
export class MyPlanComponent implements OnInit {
  private authService = inject(AuthService);
  private plansService = inject(WorkoutPlansService);
  private activityDataService = inject(ActivityDataService);
  private dialog = inject(Dialog);

  plans = signal<WorkoutPlan[]>([]);
  loading = signal(true);
  selectedPlanIdx = signal(0);
  selectedWeek = signal(1);

  selectedPlan = signal<WorkoutPlan | null>(null);
  currentWeek = computed(() => {
    const plan = this.selectedPlan();
    if (!plan) return null;
    return plan.weeks.find(w => w.weekNumber === this.selectedWeek()) || null;
  });

  activityDataMap = signal<Map<string, ActivityData>>(new Map());

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.plansService.getByAthlete(user._id).subscribe({
      next: plans => {
        this.plans.set(plans);
        if (plans.length > 0) {
          this.selectedPlan.set(plans[0]);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Load activity data for this athlete
    this.activityDataService.getByAthlete(user._id).subscribe({
      next: activities => {
        const map = new Map<string, ActivityData>();
        for (const activity of activities) {
          if (activity.matched && activity.planId && activity.weekNumber != null && activity.sessionIndex != null) {
            const key = `${activity.planId}-${activity.weekNumber}-${activity.sessionIndex}`;
            map.set(key, activity);
          }
        }
        this.activityDataMap.set(map);
      },
    });
  }

  selectPlan(idx: number) {
    this.selectedPlanIdx.set(idx);
    this.selectedPlan.set(this.plans()[idx]);
    this.selectedWeek.set(1);
  }

  weekTotal(week: Week): number {
    return week.sessions.length;
  }

  weekCompleted(week: Week): number {
    return week.sessions.filter(s => s.status === SessionStatus.COMPLETED).length;
  }

  weekPercent(week: Week): number {
    const total = this.weekTotal(week);
    return total > 0 ? Math.round((this.weekCompleted(week) / total) * 100) : 0;
  }

  openFeedback(event: { session: Session; dayOfWeek: number }) {
    const ref = this.dialog.open(SessionFeedbackDialogComponent, {
      data: { session: event.session },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });

    ref.closed.subscribe(raw => {
      const result = raw as UpdateSessionFeedbackRequest | null | undefined;
      if (!result) return;
      const plan = this.selectedPlan()!;
      const weekNum = this.selectedWeek();
      const week = plan.weeks.find(w => w.weekNumber === weekNum);
      if (!week) return;
      const sessionIdx = week.sessions.findIndex(s => s.dayOfWeek === event.dayOfWeek);
      if (sessionIdx === -1) return;

      this.plansService.updateSessionFeedback(plan._id, weekNum, sessionIdx, result).subscribe({
        next: updatedPlan => {
          const plans = this.plans().map(p => p._id === updatedPlan._id ? updatedPlan : p);
          this.plans.set(plans);
          this.selectedPlan.set(updatedPlan);
        },
      });
    });
  }
}
