import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Session, UpdateSessionFeedbackRequest } from '../../../../models/workout-plan.model';
import { ActivityData } from '../../../../models/activity-data.model';
import { SessionStatus } from '../../../../core/models/enums';
import { RpeSelectorComponent } from '../../../../shared/components/rpe-selector/rpe-selector.component';
import { SessionStatusLabelPipe } from '../../../../shared/pipes/session-status-label.pipe';
import { SessionDetailComponent } from '../session-detail/session-detail.component';

@Component({
  selector: 'app-session-feedback-dialog',
  standalone: true,
  imports: [FormsModule, RpeSelectorComponent, SessionStatusLabelPipe, SessionDetailComponent],
  template: `
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog-glass rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
      <h2 id="dialog-title" class="text-lg font-bold text-primary-700 mb-4">Mi Feedback</h2>

      @if (activityData) {
        <app-session-detail [session]="data.session" [activityData]="activityData" />
        <hr class="my-4 border-primary-200" />
      }

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Estado</label>
          <select [(ngModel)]="feedback.status" name="status" class="w-full">
            @for (s of statuses; track s) {
              <option [value]="s">{{ s | sessionStatusLabel }}</option>
            }
          </select>
        </div>

        <app-rpe-selector
          [value]="feedback.athletePerception ?? null"
          (valueChange)="feedback.athletePerception = $event" />

        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Comentario</label>
          <textarea [(ngModel)]="feedback.athleteFeedback" name="athleteFeedback" class="w-full" rows="3" placeholder="¿Cómo te sentiste?"></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="dialogRef.close()" class="btn-secondary">
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            Guardar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class SessionFeedbackDialogComponent implements OnInit {
  dialogRef = inject(DialogRef<UpdateSessionFeedbackRequest | null>);
  data: { session: Session; activityData: ActivityData | null } = inject(DIALOG_DATA);
  activityData = this.data.activityData;

  statuses = Object.values(SessionStatus);
  feedback: UpdateSessionFeedbackRequest = {};

  ngOnInit() {
    const s = this.data.session;
    this.feedback = {
      status: s.status,
      athletePerception: s.athletePerception,
      athleteFeedback: s.athleteFeedback || '',
    };
  }

  onSubmit() {
    this.dialogRef.close(this.feedback);
  }
}
