import { Component, inject, input, output } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Week, Session } from '../../../../models/workout-plan.model';
import { WorkoutType, SessionStatus } from '../../../../core/models/enums';
import { WorkoutTypeIconComponent } from '../../../../shared/components/workout-type-icon/workout-type-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SessionEditorDialogComponent } from '../session-editor-dialog/session-editor-dialog.component';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Component({
  selector: 'app-week-editor',
  standalone: true,
  imports: [WorkoutTypeIconComponent, StatusBadgeComponent],
  template: `
    <div class="card-glass rounded-xl p-4">
      <h3 class="text-sm font-semibold text-primary-600 mb-3">Semana {{ week().weekNumber }}</h3>

      <div class="grid grid-cols-7 gap-2">
        @for (dayIdx of dayIndices; track dayIdx) {
          <div
            class="border border-white/30 rounded-lg p-2 min-h-[100px] cursor-pointer hover:bg-white/30 transition-colors"
            (click)="editSession(dayIdx)">
            <p class="text-xs font-medium text-primary-500 mb-1">{{ dayNames[dayIdx] }}</p>
            @if (getSession(dayIdx); as session) {
              <div class="space-y-1">
                <app-workout-type-icon [type]="session.type" />
                @if (session.description) {
                  <p class="text-xs text-primary-500 line-clamp-2">{{ session.description }}</p>
                }
                @if (session.duration) {
                  <p class="text-xs text-primary-400">{{ session.duration }}min</p>
                }
                <app-status-badge [status]="session.status" />
              </div>
            } @else {
              <p class="text-xs text-primary-300 italic">Sin sesión</p>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class WeekEditorComponent {
  private dialog = inject(Dialog);

  week = input.required<Week>();
  weekChange = output<Week>();
  startDate = input.required<string>();

  dayIndices = [0, 1, 2, 3, 4, 5, 6];
  dayNames = DAY_NAMES;

  getSession(dayOfWeek: number): Session | undefined {
    return this.week().sessions.find(s => s.dayOfWeek === dayOfWeek);
  }

  editSession(dayOfWeek: number) {
    const existing = this.getSession(dayOfWeek);
    const session: Session = existing ?? {
      dayOfWeek,
      date: this.startDate(),
      type: WorkoutType.REST,
      status: SessionStatus.PLANNED,
    };

    const ref = this.dialog.open(SessionEditorDialogComponent, {
      data: { session, date: this.startDate() },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });

    ref.closed.subscribe(raw => {
      const result = raw as Session | null | undefined;
      if (!result) return;
      const updatedSessions = existing
        ? this.week().sessions.map(s => s.dayOfWeek === dayOfWeek ? result : s)
        : [...this.week().sessions, result];
      this.weekChange.emit({ ...this.week(), sessions: updatedSessions });
    });
  }
}
