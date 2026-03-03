import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { GoalRacesService } from '../../../../services/goal-races.service';
import { GoalRace } from '../../../../models/goal-race.model';

@Component({
  selector: 'app-goal-race-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-surface rounded-xl p-6 shadow-xl w-full max-w-md">
      <h2 class="text-lg font-bold text-primary-700 mb-4">
        {{ isEdit ? 'Editar Carrera Objetivo' : 'Nueva Carrera Objetivo' }}
      </h2>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Nombre</label>
          <input [(ngModel)]="form.name" name="name" required class="w-full" placeholder="Ej: Ultra Trail de Córdoba" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Distancia</label>
            <input [(ngModel)]="form.distance" name="distance" required class="w-full" placeholder="Ej: 42K" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Fecha</label>
            <input [(ngModel)]="form.date" name="date" type="date" required class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Ubicación</label>
          <input [(ngModel)]="form.location" name="location" class="w-full" placeholder="Ej: Córdoba, Argentina" />
        </div>

        <h3 class="text-sm font-semibold text-primary-600 mt-4">Resultado (opcional)</h3>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-primary-400 mb-1">Tiempo</label>
            <input [(ngModel)]="resultTime" name="resultTime" class="w-full" placeholder="3:45:00" />
          </div>
          <div>
            <label class="block text-xs text-primary-400 mb-1">Pos. General</label>
            <input [(ngModel)]="resultGeneral" name="resultGeneral" type="number" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-primary-400 mb-1">Pos. Categoría</label>
            <input [(ngModel)]="resultCategory" name="resultCategory" type="number" class="w-full" />
          </div>
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
export class GoalRaceFormComponent implements OnInit {
  dialogRef = inject(DialogRef<boolean>);
  data: { athleteId: string; race?: GoalRace } = inject(DIALOG_DATA);
  private racesService = inject(GoalRacesService);

  isEdit = false;
  form = { name: '', distance: '', date: '', location: '' };
  resultTime = '';
  resultGeneral: number | null = null;
  resultCategory: number | null = null;

  ngOnInit() {
    if (this.data.race) {
      this.isEdit = true;
      const r = this.data.race;
      this.form = { name: r.name, distance: r.distance, date: r.date.slice(0, 10), location: r.location || '' };
      if (r.result) {
        this.resultTime = r.result.time || '';
        this.resultGeneral = r.result.generalPosition ?? null;
        this.resultCategory = r.result.categoryPosition ?? null;
      }
    }
  }

  onSubmit() {
    const result = (this.resultTime || this.resultGeneral || this.resultCategory)
      ? { time: this.resultTime || undefined, generalPosition: this.resultGeneral ?? undefined, categoryPosition: this.resultCategory ?? undefined }
      : undefined;

    if (this.isEdit) {
      this.racesService.update(this.data.race!._id, { ...this.form, result }).subscribe(() => this.dialogRef.close(true));
    } else {
      this.racesService.create({ ...this.form, athleteId: this.data.athleteId, result }).subscribe(() => this.dialogRef.close(true));
    }
  }
}
