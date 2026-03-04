import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { WorkoutPlansService } from '../../../services/workout-plans.service';
import { ActivityDataService } from '../../../services/activity-data.service';
import { StravaService } from '../../../services/strava.service';
import { WorkoutPlan, Session, UpdateSessionFeedbackRequest } from '../../../models/workout-plan.model';
import { ActivityData } from '../../../models/activity-data.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { WeekViewComponent } from './week-view/week-view.component';
import { SessionFeedbackDialogComponent } from './session-feedback-dialog/session-feedback-dialog.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-my-plan',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, ErrorStateComponent, WeekViewComponent, DatePipe],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (errorState()) {
      <app-error-state (retry)="loadData()" />
    } @else if (plans().length === 0) {
      <app-empty-state icon="📋" message="No tenés planes asignados" submessage="Tu coach te asignará un plan pronto"
        actionLabel="Contactar a mi coach" actionLink="/athlete/messages" />
    } @else {
      <div>
        @if (selectedPlan(); as plan) {
          <!-- Header -->
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <div>
                <h1 class="text-xl md:text-2xl font-semibold text-primary-800 tracking-tight">{{ plan.name }}</h1>
                @if (plan.sport) {
                  <p class="text-sm text-primary-400">{{ plan.sport }}</p>
                }
              </div>
            </div>

            <!-- Plan selector pills -->
            @if (plans().length > 1) {
              <div class="flex flex-wrap gap-2 mt-4">
                @for (p of plans(); track p._id; let i = $index) {
                  <button
                    (click)="selectPlan(i)"
                    [class]="selectedPlanIdx() === i
                      ? 'rounded-full bg-primary-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all'
                      : 'rounded-full border border-primary-200 px-4 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-all'">
                    {{ p.name }}
                  </button>
                }
              </div>
            }
          </div>

          <!-- Unmatched Strava activities -->
          @if (unmatchedActivities().length > 0) {
            <div class="mb-6 card-glass rounded-2xl p-4 border-l-4 border-l-orange-500">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-primary-700 flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                  </svg>
                  Actividades Strava sin vincular
                </h3>
                <button
                  (click)="syncStrava()"
                  [disabled]="syncing()"
                  class="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50">
                  @if (syncing()) {
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Sincronizando...
                  } @else {
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
                    </svg>
                    Sincronizar Strava
                  }
                </button>
              </div>
              <div class="space-y-2">
                @for (activity of unmatchedActivities(); track activity._id) {
                  <div class="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2 text-sm">
                    <svg class="w-4 h-4 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                    </svg>
                    <span class="font-medium text-primary-700 truncate">{{ activity.name }}</span>
                    <span class="text-primary-400 text-xs shrink-0">{{ activity.type }}</span>
                    <span class="text-primary-400 text-xs shrink-0 ml-auto">{{ activity.startDate | date:'d MMM' }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- All weeks -->
          <div class="space-y-4">
            @for (week of plan.weeks; track week.weekNumber) {
              <app-week-view
                [week]="week"
                [activityDataMap]="activityDataMap()"
                [planId]="plan._id"
                (sessionClick)="openFeedback($event)" />
            }
          </div>

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
  private stravaService = inject(StravaService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  plans = signal<WorkoutPlan[]>([]);
  loading = signal(true);
  errorState = signal(false);
  selectedPlanIdx = signal(0);
  selectedPlan = signal<WorkoutPlan | null>(null);

  activityDataMap = signal<Map<string, ActivityData>>(new Map());
  unmatchedActivities = signal<ActivityData[]>([]);
  syncing = signal(false);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.loading.set(true);
    this.errorState.set(false);

    this.plansService.getByAthlete(user._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: plans => {
        this.plans.set(plans);
        if (plans.length > 0) {
          this.selectedPlan.set(plans[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.loading.set(false);
      },
    });

    // Load activity data for this athlete
    this.activityDataService.getByAthlete(user._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    // Load unmatched Strava activities
    this.activityDataService.getUnmatched(user._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: activities => this.unmatchedActivities.set(activities),
      error: () => {},
    });
  }

  selectPlan(idx: number) {
    this.selectedPlanIdx.set(idx);
    this.selectedPlan.set(this.plans()[idx]);
  }

  syncStrava() {
    this.syncing.set(true);
    this.stravaService.syncRecent().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.syncing.set(false);
        this.toast.success('Sincronización completada');
        this.loadData();
      },
      error: () => {
        this.syncing.set(false);
        this.toast.error('Error al sincronizar con Strava');
      },
    });
  }

  openFeedback(event: { session: Session; dayOfWeek: number; weekNumber: number; sessionIndex: number }) {
    const plan = this.selectedPlan();
    const key = plan ? `${plan._id}-${event.weekNumber}-${event.sessionIndex}` : '';
    const activityData = this.activityDataMap().get(key) ?? null;

    const ref = this.dialog.open(SessionFeedbackDialogComponent, {
      data: { session: event.session, activityData },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });

    ref.closed.subscribe(raw => {
      const result = raw as UpdateSessionFeedbackRequest | null | undefined;
      if (!result) return;
      const plan = this.selectedPlan()!;
      const weekNum = event.weekNumber;
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
