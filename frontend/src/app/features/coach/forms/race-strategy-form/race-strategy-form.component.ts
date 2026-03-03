import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { RaceStrategiesService } from '../../../../services/race-strategies.service';
import { RaceStrategy, Segment } from '../../../../models/race-strategy.model';

@Component({
  selector: 'app-race-strategy-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-surface rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h2 class="text-lg font-bold text-primary-700 mb-4">
        {{ isEdit ? 'Editar Estrategia' : 'Nueva Estrategia de Carrera' }}
      </h2>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Nombre de la carrera</label>
          <input [(ngModel)]="form.raceName" name="raceName" required class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Fecha</label>
            <input [(ngModel)]="form.raceDate" name="raceDate" type="date" required class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Distancia total (km)</label>
            <input [(ngModel)]="form.totalDistance" name="totalDistance" type="number" required class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Activación pre-carrera</label>
          <textarea [(ngModel)]="form.preRaceActivation" name="preRaceActivation" class="w-full" rows="2"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Notas pre-carrera</label>
          <textarea [(ngModel)]="form.preRaceNotes" name="preRaceNotes" class="w-full" rows="2"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Técnica general</label>
          <textarea [(ngModel)]="form.generalTechnique" name="generalTechnique" class="w-full" rows="2"></textarea>
        </div>

        <!-- Segmentos -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-semibold text-primary-600">Segmentos</label>
            <button type="button" (click)="addSegment()" class="text-xs text-accent-500 hover:text-accent-700">+ Agregar</button>
          </div>
          @for (seg of segments; track $index) {
            <div class="bg-surface-alt rounded-lg p-3 mb-2 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-primary-500">Segmento {{ $index + 1 }}</span>
                <button type="button" (click)="removeSegment($index)" class="text-xs text-danger-500">Eliminar</button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-primary-400">Desde km</label>
                  <input [(ngModel)]="seg.fromKm" [name]="'segFrom' + $index" type="number" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs text-primary-400">Hasta km</label>
                  <input [(ngModel)]="seg.toKm" [name]="'segTo' + $index" type="number" class="w-full" />
                </div>
              </div>
              <div>
                <label class="block text-xs text-primary-400">Objetivo</label>
                <input [(ngModel)]="seg.objective" [name]="'segObj' + $index" class="w-full" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-primary-400">Zona de ritmo</label>
                  <input [(ngModel)]="seg.paceZone" [name]="'segPace' + $index" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs text-primary-400">Clave estratégica</label>
                  <input [(ngModel)]="seg.strategicKey" [name]="'segKey' + $index" class="w-full" />
                </div>
              </div>
            </div>
          }
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
export class RaceStrategyFormComponent implements OnInit {
  dialogRef = inject(DialogRef<boolean>);
  data: { athleteId: string; strategy?: RaceStrategy } = inject(DIALOG_DATA);
  private strategiesService = inject(RaceStrategiesService);

  isEdit = false;
  form = { raceName: '', raceDate: '', totalDistance: 0, preRaceActivation: '', preRaceNotes: '', generalTechnique: '' };
  segments: Segment[] = [];

  ngOnInit() {
    if (this.data.strategy) {
      this.isEdit = true;
      const s = this.data.strategy;
      this.form = {
        raceName: s.raceName,
        raceDate: s.raceDate.slice(0, 10),
        totalDistance: s.totalDistance,
        preRaceActivation: s.preRaceActivation || '',
        preRaceNotes: s.preRaceNotes || '',
        generalTechnique: s.generalTechnique || '',
      };
      this.segments = [...(s.segments || [])];
    }
  }

  addSegment() {
    this.segments.push({ fromKm: 0, toKm: 0, objective: '', paceZone: '', strategicKey: '' });
  }

  removeSegment(i: number) {
    this.segments.splice(i, 1);
  }

  onSubmit() {
    const payload = { ...this.form, segments: this.segments, athleteId: this.data.athleteId };
    if (this.isEdit) {
      const { athleteId, ...rest } = payload;
      this.strategiesService.update(this.data.strategy!._id, rest).subscribe(() => this.dialogRef.close(true));
    } else {
      this.strategiesService.create(payload).subscribe(() => this.dialogRef.close(true));
    }
  }
}
