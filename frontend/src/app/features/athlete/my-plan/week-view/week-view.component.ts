import { Component, input, output, computed } from '@angular/core';
import { format } from 'date-fns';
import { Week, Session } from '../../../../models/workout-plan.model';
import { ActivityData } from '../../../../models/activity-data.model';
import { SessionStatus } from '../../../../core/models/enums';
import { WorkoutTypeIconComponent } from '../../../../shared/components/workout-type-icon/workout-type-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { WorkoutTypeLabelPipe } from '../../../../shared/pipes/workout-type-label.pipe';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [WorkoutTypeIconComponent, StatusBadgeComponent, WorkoutTypeLabelPipe],
  template: `
    <div class="card-glass rounded-xl p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-primary-600">Semana {{ week().weekNumber }}</h3>
          @if (weekTotal() > 0) {
            <span [class]="progressBadgeClass()">
              {{ weekCompleted() }}/{{ weekTotal() }}
            </span>
          }
        </div>
        @if (hasPendingFeedback()) {
          <span class="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/30 rounded-full px-2.5 py-0.5">
            {{ pendingCount() }} sin feedback
          </span>
        }
      </div>

      <!-- Desktop Grid -->
      <div class="hidden md:block overflow-x-auto">
        <div>
          <!-- Day headers -->
          <div class="grid grid-cols-7 gap-2 mb-2">
            @for (dayIdx of dayIndices; track dayIdx) {
              <p class="text-xs font-medium text-primary-400 text-center">
                {{ dayNames[dayIdx] }}
                @if (isToday(dayIdx)) {
                  <span class="text-[10px] font-bold text-accent-500 ml-0.5">HOY</span>
                }
              </p>
            }
          </div>

          <!-- Day cells -->
          <div class="grid grid-cols-7 gap-2">
            @for (dayIdx of dayIndices; track dayIdx) {
              <div
                class="min-h-[100px] border border-primary-200 rounded-lg p-2 cursor-pointer hover:bg-primary-50 transition-colors"
                [class.ring-2]="isToday(dayIdx)"
                [class.ring-accent-500]="isToday(dayIdx)"
                [class.border-l-4]="needsFeedback(dayIdx)"
                [class.border-l-amber-400]="needsFeedback(dayIdx)"
                [style.background-color]="isToday(dayIdx) ? 'rgb(0 188 212 / 0.1)' : ''"
                (click)="onCellClick(dayIdx)">
                @if (getSession(dayIdx); as session) {
                  <div class="space-y-1">
                    <app-workout-type-icon [type]="session.type" />
                    @if (session.description) {
                      <p class="text-xs text-primary-500 line-clamp-2">{{ session.description }}</p>
                    }
                    <div class="flex flex-wrap gap-1 text-[10px] text-primary-400">
                      @if (session.duration) {
                        <span>{{ session.duration }}min</span>
                      }
                      @if (session.distance) {
                        <span>{{ session.distance }}km</span>
                      }
                    </div>
                    <app-status-badge [status]="session.status" />
                    <div class="flex items-center gap-1 mt-0.5">
                      @if (session.athletePerception) {
                        <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                              [class]="getRpeClass(session.athletePerception)">
                          RPE {{ session.athletePerception }}
                        </span>
                      }
                      @if (getActivityForSession(dayIdx)) {
                        <svg viewBox="0 0 24 24" class="w-3 h-3 shrink-0" fill="#FC4C02">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                      }
                    </div>
                  </div>
                } @else {
                  <p class="text-xs text-primary-300 italic">Descanso</p>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Mobile Stacked View -->
      <div class="md:hidden space-y-2">
        @for (dayIdx of dayIndices; track dayIdx) {
          @if (getSession(dayIdx) || isToday(dayIdx)) {
            <div
              class="border border-primary-200 rounded-lg p-3 cursor-pointer hover:bg-primary-50 transition-colors"
              [class.ring-2]="isToday(dayIdx)"
              [class.ring-accent-500]="isToday(dayIdx)"
              [class.border-l-4]="needsFeedback(dayIdx)"
              [class.border-l-amber-400]="needsFeedback(dayIdx)"
              [style.background-color]="isToday(dayIdx) ? 'rgb(0 188 212 / 0.1)' : ''"
              (click)="onCellClick(dayIdx)">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold text-primary-500">{{ dayNamesFull[dayIdx] }}</span>
                @if (isToday(dayIdx)) {
                  <span class="text-[10px] font-bold bg-accent-500 text-white rounded-full px-2 py-0.5">HOY</span>
                }
              </div>
              @if (getSession(dayIdx); as session) {
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <app-workout-type-icon [type]="session.type" />
                      <span class="text-sm font-medium text-primary-600">{{ session.type | workoutTypeLabel }}</span>
                    </div>
                    @if (session.description) {
                      <p class="text-xs text-primary-500 line-clamp-2 mb-1">{{ session.description }}</p>
                    }
                    <div class="flex flex-wrap items-center gap-2">
                      @if (session.duration) {
                        <span class="text-xs text-primary-400">{{ session.duration }}min</span>
                      }
                      @if (session.distance) {
                        <span class="text-xs text-primary-400">{{ session.distance }}km</span>
                      }
                      <app-status-badge [status]="session.status" />
                      @if (session.athletePerception) {
                        <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                              [class]="getRpeClass(session.athletePerception)">
                          RPE {{ session.athletePerception }}
                        </span>
                      }
                      @if (getActivityForSession(dayIdx)) {
                        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 shrink-0" fill="#FC4C02">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                      }
                    </div>
                  </div>
                </div>
              } @else {
                <p class="text-xs text-primary-300 italic">Descanso</p>
              }
            </div>
          } @else {
            <!-- Rest day (no session, not today) -->
            <div class="border border-primary-100 rounded-lg px-3 py-2 bg-primary-50/30">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-primary-400">{{ dayNamesFull[dayIdx] }}</span>
                <span class="text-xs text-primary-300 italic">Descanso</span>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class WeekViewComponent {
  week = input.required<Week>();
  activityDataMap = input<Map<string, ActivityData>>(new Map());
  planId = input<string>('');
  sessionClick = output<{ session: Session; dayOfWeek: number; weekNumber: number; sessionIndex: number }>();

  dayIndices = [0, 1, 2, 3, 4, 5, 6];
  dayNames = DAY_NAMES;
  dayNamesFull = DAY_NAMES_FULL;
  todayStr = format(new Date(), 'yyyy-MM-dd');

  weekTotal = computed(() => this.week().sessions.length);

  weekCompleted = computed(() =>
    this.week().sessions.filter(s => s.status === SessionStatus.COMPLETED).length,
  );

  progressBadgeClass = computed(() => {
    const total = this.weekTotal();
    const pct = total > 0 ? Math.round((this.weekCompleted() / total) * 100) : 0;
    const base = 'rounded-full px-2 py-0.5 text-[10px] font-semibold';
    if (pct >= 80) return `${base} bg-green-500/20 text-green-600 dark:text-green-400`;
    if (pct >= 50) return `${base} bg-yellow-500/20 text-yellow-600 dark:text-yellow-400`;
    return `${base} bg-primary-50 text-primary-400`;
  });

  isToday(dayOfWeek: number): boolean {
    const session = this.getSession(dayOfWeek);
    return !!session && session.date?.substring(0, 10) === this.todayStr;
  }

  getSession(dayOfWeek: number): Session | undefined {
    return this.week().sessions.find(s => s.dayOfWeek === dayOfWeek);
  }

  getActivityForSession(dayOfWeek: number): ActivityData | undefined {
    const sessions = this.week().sessions;
    const sessionIdx = sessions.findIndex(s => s.dayOfWeek === dayOfWeek);
    if (sessionIdx === -1) return undefined;

    const key = `${this.planId()}-${this.week().weekNumber}-${sessionIdx}`;
    return this.activityDataMap().get(key);
  }

  needsFeedback(dayOfWeek: number): boolean {
    const session = this.getSession(dayOfWeek);
    if (!session) return false;
    return (
      session.status === SessionStatus.COMPLETED &&
      !session.athletePerception &&
      session.type !== 'REST'
    );
  }

  hasPendingFeedback(): boolean {
    return this.pendingCount() > 0;
  }

  pendingCount(): number {
    return this.week().sessions.filter(
      s =>
        s.status === SessionStatus.COMPLETED &&
        !s.athletePerception &&
        s.type !== 'REST',
    ).length;
  }

  onCellClick(dayIdx: number) {
    const session = this.getSession(dayIdx);
    if (session) {
      const sessionIndex = this.week().sessions.findIndex(s => s.dayOfWeek === dayIdx);
      this.sessionClick.emit({ session, dayOfWeek: dayIdx, weekNumber: this.week().weekNumber, sessionIndex });
    }
  }

  getRpeClass(rpe: number): string {
    if (rpe <= 3) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    if (rpe <= 6) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
    if (rpe <= 8) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
  }
}
