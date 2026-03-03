import { Component, input, output, computed } from '@angular/core';
import { Week, Session } from '../../../../models/workout-plan.model';
import { ActivityData } from '../../../../models/activity-data.model';
import { SessionStatus } from '../../../../core/models/enums';
import { WorkoutTypeIconComponent } from '../../../../shared/components/workout-type-icon/workout-type-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [WorkoutTypeIconComponent, StatusBadgeComponent],
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
          <span class="text-xs font-medium text-amber-700 bg-amber-50/60 rounded-full px-2.5 py-0.5">
            {{ pendingCount() }} sin feedback
          </span>
        }
      </div>

      <!-- Grid -->
      <div class="overflow-x-auto">
        <div class="min-w-[640px]">
          <!-- Day headers -->
          <div class="grid grid-cols-7 gap-2 mb-2">
            @for (day of dayNames; track day) {
              <p class="text-xs font-medium text-primary-400 text-center">{{ day }}</p>
            }
          </div>

          <!-- Day cells -->
          <div class="grid grid-cols-7 gap-2">
            @for (dayIdx of dayIndices; track dayIdx) {
              <div
                class="min-h-[100px] border border-white/30 rounded-lg p-2 cursor-pointer hover:bg-white/30 transition-colors"
                [class.border-l-4]="needsFeedback(dayIdx)"
                [class.border-l-amber-400]="needsFeedback(dayIdx)"
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
    </div>
  `,
})
export class WeekViewComponent {
  week = input.required<Week>();
  activityDataMap = input<Map<string, ActivityData>>(new Map());
  planId = input<string>('');
  sessionClick = output<{ session: Session; dayOfWeek: number; weekNumber: number }>();

  dayIndices = [0, 1, 2, 3, 4, 5, 6];
  dayNames = DAY_NAMES;

  weekTotal = computed(() => this.week().sessions.length);

  weekCompleted = computed(() =>
    this.week().sessions.filter(s => s.status === SessionStatus.COMPLETED).length,
  );

  progressBadgeClass = computed(() => {
    const total = this.weekTotal();
    const pct = total > 0 ? Math.round((this.weekCompleted() / total) * 100) : 0;
    const base = 'rounded-full px-2 py-0.5 text-[10px] font-semibold';
    if (pct >= 80) return `${base} bg-green-500/20 text-green-600`;
    if (pct >= 50) return `${base} bg-yellow-500/20 text-yellow-600`;
    return `${base} bg-white/30 text-primary-400`;
  });

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
      this.sessionClick.emit({ session, dayOfWeek: dayIdx, weekNumber: this.week().weekNumber });
    }
  }

  getRpeClass(rpe: number): string {
    if (rpe <= 3) return 'bg-green-100 text-green-800';
    if (rpe <= 6) return 'bg-yellow-100 text-yellow-800';
    if (rpe <= 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }
}
