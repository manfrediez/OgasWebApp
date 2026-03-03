import { Component, input } from '@angular/core';
import { Session } from '../../../../models/workout-plan.model';
import { SessionStatus } from '../../../../core/models/enums';
import { WorkoutTypeIconComponent } from '../../../../shared/components/workout-type-icon/workout-type-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { WorkoutTypeLabelPipe } from '../../../../shared/pipes/workout-type-label.pipe';
import { HrZoneLabelPipe } from '../../../../shared/pipes/hr-zone-label.pipe';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [WorkoutTypeIconComponent, StatusBadgeComponent, WorkoutTypeLabelPipe, HrZoneLabelPipe],
  template: `
    <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50 space-y-3"
         [class.border-l-4]="needsFeedback()"
         [class.border-l-amber-400]="needsFeedback()">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <app-workout-type-icon [type]="session().type" />
          <span class="font-medium text-primary-700">{{ session().type | workoutTypeLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          @if (session().athletePerception) {
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                  [class]="getRpeClass(session().athletePerception!)">
              RPE {{ session().athletePerception }}
            </span>
          } @else if (needsFeedback()) {
            <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Pendiente
            </span>
          }
          <app-status-badge [status]="session().status" />
        </div>
      </div>

      @if (session().description) {
        <p class="text-sm text-primary-600 whitespace-pre-wrap">{{ session().description }}</p>
      }

      <div class="flex flex-wrap gap-3 text-xs text-primary-400">
        @if (session().duration) {
          <span>{{ session().duration }}min</span>
        }
        @if (session().distance) {
          <span>{{ session().distance }}km</span>
        }
        @if (session().targetHRZone) {
          <span>{{ session().targetHRZone! | hrZoneLabel }}</span>
        }
      </div>

      @if (session().coachNotes) {
        <div class="bg-surface-alt rounded-lg p-3">
          <p class="text-xs font-medium text-primary-500">Notas del coach:</p>
          <p class="text-sm text-primary-600">{{ session().coachNotes }}</p>
        </div>
      }

      @if (session().competitionName) {
        <div class="bg-accent-400/10 rounded-lg p-3">
          <p class="text-xs font-medium text-accent-700">Competencia: {{ session().competitionName }}</p>
          @if (session().competitionDistance) {
            <p class="text-xs text-accent-600">{{ session().competitionDistance }} - {{ session().competitionLocation }}</p>
          }
        </div>
      }

      @if (session().alternativeDescription) {
        <div class="border-t border-primary-50 pt-2">
          <p class="text-xs text-primary-400">
            <span class="font-medium">Alternativa{{ session().alternativeLabel ? ' (' + session().alternativeLabel + ')' : '' }}:</span>
            {{ session().alternativeDescription }}
          </p>
        </div>
      }

      @if (session().athleteFeedback || session().athletePerception) {
        <div class="border-t border-primary-50 pt-2">
          <p class="text-xs font-medium text-primary-500">Mi feedback:</p>
          @if (session().athletePerception) {
            <p class="text-sm text-primary-600">RPE: {{ session().athletePerception }}/10</p>
          }
          @if (session().athleteFeedback) {
            <p class="text-sm text-primary-600">{{ session().athleteFeedback }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class SessionDetailComponent {
  session = input.required<Session>();

  needsFeedback(): boolean {
    const s = this.session();
    return (
      s.status === SessionStatus.COMPLETED &&
      !s.athletePerception &&
      s.type !== 'REST'
    );
  }

  getRpeClass(rpe: number): string {
    if (rpe <= 3) return 'bg-green-100 text-green-800';
    if (rpe <= 6) return 'bg-yellow-100 text-yellow-800';
    if (rpe <= 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }
}
