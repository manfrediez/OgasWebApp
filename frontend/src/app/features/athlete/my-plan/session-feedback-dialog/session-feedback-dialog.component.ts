import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Session, UpdateSessionFeedbackRequest } from '../../../../models/workout-plan.model';
import { SessionStatus } from '../../../../core/models/enums';
import { RpeSelectorComponent } from '../../../../shared/components/rpe-selector/rpe-selector.component';
import { SessionStatusLabelPipe } from '../../../../shared/pipes/session-status-label.pipe';

@Component({
  selector: 'app-session-feedback-dialog',
  standalone: true,
  imports: [FormsModule, RpeSelectorComponent, SessionStatusLabelPipe],
  template: `
    <div class="bg-surface rounded-xl p-6 shadow-xl w-full max-w-md">
      <h2 class="text-lg font-bold text-primary-700 mb-4">Mi Feedback</h2>

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
          <button type="button" (click)="dialogRef.close()" class="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-surface-alt">
            Cancelar
          </button>
          <button type="submit" class="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-700">
            Guardar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class SessionFeedbackDialogComponent implements OnInit {
  dialogRef = inject(DialogRef<UpdateSessionFeedbackRequest | null>);
  data: { session: Session } = inject(DIALOG_DATA);

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
