import { Component, input, output } from '@angular/core';
import { Week, Session } from '../../../../models/workout-plan.model';
import { ActivityData } from '../../../../models/activity-data.model';
import { SessionStatus } from '../../../../core/models/enums';
import { SessionDetailComponent } from '../session-detail/session-detail.component';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [SessionDetailComponent, DateEsPipe],
  template: `
    @if (hasPendingFeedback()) {
      <div class="mb-3 rounded-lg bg-amber-50/60 backdrop-blur-sm border border-amber-200/50 px-3 py-2">
        <p class="text-xs font-medium text-amber-700">
          Tenés {{ pendingCount() }} sesión{{ pendingCount() > 1 ? 'es' : '' }} completada{{ pendingCount() > 1 ? 's' : '' }} sin feedback
        </p>
      </div>
    }
    <div class="space-y-3">
      @for (dayIdx of dayIndices; track dayIdx) {
        @if (getSession(dayIdx); as session) {
          <div>
            <p class="text-xs font-medium text-primary-400 mb-1">
              {{ dayNames[dayIdx] }}
              @if (session.date) {
                - {{ session.date | dateEs }}
              }
            </p>
            <div (click)="sessionClick.emit({ session: session, dayOfWeek: dayIdx })" class="cursor-pointer">
              <app-session-detail
                [session]="session"
                [activityData]="getActivityForSession(dayIdx)" />
            </div>
          </div>
        } @else {
          <div class="py-2">
            <p class="text-xs font-medium text-primary-400 mb-1">{{ dayNames[dayIdx] }}</p>
            <p class="text-sm text-primary-300 italic pl-2">Sin sesión</p>
          </div>
        }
      }
    </div>
  `,
})
export class WeekViewComponent {
  week = input.required<Week>();
  activityDataMap = input<Map<string, ActivityData>>(new Map());
  planId = input<string>('');
  sessionClick = output<{ session: Session; dayOfWeek: number }>();

  dayIndices = [0, 1, 2, 3, 4, 5, 6];
  dayNames = DAY_NAMES;

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
}
