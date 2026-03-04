import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { WorkoutType, HRZone, SessionStatus } from '../../../../core/models/enums';
import { Session } from '../../../../models/workout-plan.model';
import { WorkoutTypeLabelPipe } from '../../../../shared/pipes/workout-type-label.pipe';
import { HrZoneLabelPipe } from '../../../../shared/pipes/hr-zone-label.pipe';

@Component({
  selector: 'app-session-editor-dialog',
  standalone: true,
  imports: [FormsModule, WorkoutTypeLabelPipe, HrZoneLabelPipe],
  template: `
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog-glass rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h2 id="dialog-title" class="text-lg font-bold text-primary-700 mb-4">Editar Sesión</h2>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Tipo</label>
            <select [(ngModel)]="session.type" name="type" class="w-full">
              @for (t of workoutTypes; track t) {
                <option [value]="t">{{ t | workoutTypeLabel }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Estado</label>
            <select [(ngModel)]="session.status" name="status" class="w-full">
              @for (s of sessionStatuses; track s) {
                <option [value]="s">{{ statusLabels[s] }}</option>
              }
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Descripción</label>
          <textarea [(ngModel)]="session.description" name="description" class="w-full" rows="3"></textarea>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Duración (min)</label>
            <input [(ngModel)]="session.duration" name="duration" type="number" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Distancia (km)</label>
            <input [(ngModel)]="session.distance" name="distance" type="number" step="0.1" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Zona FC</label>
            <select [(ngModel)]="session.targetHRZone" name="targetHRZone" class="w-full">
              <option [ngValue]="undefined">-</option>
              @for (z of hrZones; track z) {
                <option [value]="z">{{ z | hrZoneLabel }}</option>
              }
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Notas del coach</label>
          <textarea [(ngModel)]="session.coachNotes" name="coachNotes" class="w-full" rows="2"></textarea>
        </div>

        <!-- Athlete feedback (read-only) -->
        @if (session.athleteFeedback || session.athletePerception) {
          <div class="bg-accent-400/10 rounded-lg p-3 border border-accent-400/20">
            <p class="text-xs font-semibold text-accent-700 mb-1">Feedback del atleta</p>
            @if (session.athletePerception) {
              <p class="text-sm text-primary-600">RPE: <span class="font-semibold">{{ session.athletePerception }}/10</span></p>
            }
            @if (session.athleteFeedback) {
              <p class="text-sm text-primary-600 mt-1">{{ session.athleteFeedback }}</p>
            }
          </div>
        }

        <!-- Competencia fields -->
        @if (session.type === 'COMPETITION') {
          <div class="border-t border-primary-100 pt-4">
            <h3 class="text-sm font-semibold text-primary-600 mb-2">Datos de competencia</h3>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-primary-400 mb-1">Nombre</label>
                <input [(ngModel)]="session.competitionName" name="compName" class="w-full" />
              </div>
              <div>
                <label class="block text-xs text-primary-400 mb-1">Distancia</label>
                <input [(ngModel)]="session.competitionDistance" name="compDist" class="w-full" />
              </div>
              <div>
                <label class="block text-xs text-primary-400 mb-1">Ubicación</label>
                <input [(ngModel)]="session.competitionLocation" name="compLoc" class="w-full" />
              </div>
            </div>
          </div>
        }

        <!-- Secondary session -->
        <div class="border-t border-primary-100 pt-4">
          <h3 class="text-sm font-semibold text-primary-600 mb-2">Sesión secundaria (opcional)</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-primary-400 mb-1">Tipo</label>
              <select [(ngModel)]="session.secondaryType" name="secondaryType" class="w-full">
                <option [ngValue]="undefined">-</option>
                @for (t of workoutTypes; track t) {
                  <option [value]="t">{{ t | workoutTypeLabel }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs text-primary-400 mb-1">Descripción</label>
              <input [(ngModel)]="session.secondaryDescription" name="secondaryDesc" class="w-full" />
            </div>
          </div>
        </div>

        <!-- Alternative -->
        <div class="border-t border-primary-100 pt-4">
          <h3 class="text-sm font-semibold text-primary-600 mb-2">Alternativa (opcional)</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-primary-400 mb-1">Etiqueta</label>
              <input [(ngModel)]="session.alternativeLabel" name="altLabel" class="w-full" />
            </div>
            <div>
              <label class="block text-xs text-primary-400 mb-1">Descripción</label>
              <input [(ngModel)]="session.alternativeDescription" name="altDesc" class="w-full" />
            </div>
          </div>
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
export class SessionEditorDialogComponent implements OnInit {
  dialogRef = inject(DialogRef<Session | null>);
  data: { session: Session; date: string } = inject(DIALOG_DATA);

  workoutTypes = Object.values(WorkoutType);
  hrZones = Object.values(HRZone);
  sessionStatuses = Object.values(SessionStatus);
  statusLabels: Record<string, string> = {
    [SessionStatus.PLANNED]: 'Planificada',
    [SessionStatus.COMPLETED]: 'Completada',
    [SessionStatus.SKIPPED]: 'Omitida',
  };
  session!: Session;

  ngOnInit() {
    this.session = { ...this.data.session };
  }

  onSubmit() {
    this.dialogRef.close(this.session);
  }
}
