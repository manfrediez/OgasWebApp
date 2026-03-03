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
        @if (selectedPlan(); as plan) {
          <!-- Hero banner -->
          <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-700 via-primary-500 to-accent-600 px-6 py-6 md:px-8 md:py-8 mb-6">
            <svg class="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 200" preserveAspectRatio="none">
              <path d="M0 200 L0 120 Q100 60 200 100 T400 80 T600 110 T800 70 L800 200Z" fill="white"/>
              <path d="M0 200 L0 150 Q150 100 300 130 T600 100 T800 140 L800 200Z" fill="white" opacity="0.5"/>
            </svg>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-2">
                <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div>
                  <h1 class="text-xl md:text-2xl font-bold text-white">{{ plan.name }}</h1>
                  @if (plan.sport) {
                    <p class="text-sm text-white/70">{{ plan.sport }}</p>
                  }
                </div>
              </div>

              <!-- Plan selector pills (inside banner) -->
              @if (plans().length > 1) {
                <div class="flex flex-wrap gap-2 mt-4">
                  @for (p of plans(); track p._id; let i = $index) {
                    <button
                      (click)="selectPlan(i)"
                      [class]="selectedPlanIdx() === i
                        ? 'rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-primary-700 shadow-sm transition-all'
                        : 'rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-all'">
                      {{ p.name }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Week tabs -->
          <div class="flex gap-2 mb-5 overflow-x-auto pb-1">
            @for (week of plan.weeks; track week.weekNumber) {
              <button
                (click)="selectedWeek.set(week.weekNumber)"
                [class]="selectedWeek() === week.weekNumber
                  ? 'flex items-center gap-1.5 rounded-xl bg-primary-500 px-3 md:px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200'
                  : 'flex items-center gap-1.5 rounded-xl bg-white/60 backdrop-blur-sm px-3 md:px-4 py-2.5 text-sm font-medium text-primary-500 hover:bg-white/80 hover:shadow-sm transition-all duration-200'">
                @if (weekTotal(week) > 0 && weekPercent(week) === 100) {
                  <svg class="w-4 h-4 shrink-0" [class]="selectedWeek() === week.weekNumber ? 'text-green-300' : 'text-green-500'" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                <span>Sem {{ week.weekNumber }}</span>
                @if (weekTotal(week) > 0) {
                  <span [class]="weekPercent(week) >= 80
                    ? 'rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold ' + (selectedWeek() === week.weekNumber ? 'text-green-200' : 'text-green-600')
                    : weekPercent(week) >= 50
                      ? 'rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold ' + (selectedWeek() === week.weekNumber ? 'text-yellow-200' : 'text-yellow-600')
                      : 'rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-semibold ' + (selectedWeek() === week.weekNumber ? 'text-white/80' : 'text-primary-400')">
                    {{ weekCompleted(week) }}/{{ weekTotal(week) }}
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
            <div class="mt-6 card-glass rounded-2xl p-5 border-l-4 border-l-accent-500">
              <h3 class="text-sm font-semibold text-primary-700 mb-3 flex items-center gap-2">
                <div class="h-8 w-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                Protocolo de Activación
              </h3>
              <p class="text-sm text-primary-500 whitespace-pre-wrap leading-relaxed">{{ plan.activationProtocol }}</p>
            </div>
          }

          <!-- General notes -->
          @if (plan.generalNotes && plan.generalNotes.length > 0) {
            <div class="mt-4 card-glass rounded-2xl p-5 border-l-4 border-l-accent-500">
              <h3 class="text-sm font-semibold text-primary-700 mb-3 flex items-center gap-2">
                <div class="h-8 w-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                Notas Generales
              </h3>
              <div class="space-y-2">
                @for (note of plan.generalNotes; track $index) {
                  <p class="text-sm text-primary-500 leading-relaxed flex items-start gap-2">
                    <span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-400 shrink-0"></span>
                    {{ note }}
                  </p>
                }
              </div>
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
      error: () => {},
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
