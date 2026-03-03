import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { AthleteMetricsService } from '../../../../services/athlete-metrics.service';
import { AthleteMetrics } from '../../../../models/athlete-metrics.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-metrics-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dialog-glass rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h2 class="text-lg font-bold text-primary-700 mb-4">
        {{ isEdit ? 'Editar Métricas' : 'Crear Métricas' }}
      </h2>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Edad</label>
            <input [(ngModel)]="form.age" name="age" type="number" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">VAM</label>
            <input [(ngModel)]="form.vam" name="vam" type="number" step="0.1" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">VT2</label>
            <input [(ngModel)]="form.vt2" name="vt2" type="number" step="0.1" class="w-full" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">FC Max</label>
            <input [(ngModel)]="form.fcMax" name="fcMax" type="number" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Horas semanales</label>
            <input [(ngModel)]="form.weeklyAvailableHours" name="weeklyAvailableHours" type="number" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Objetivos corto plazo</label>
          <textarea [(ngModel)]="form.objectivesShortTerm" name="objectivesShortTerm" class="w-full" rows="2"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Objetivos mediano plazo</label>
          <textarea [(ngModel)]="form.objectivesMediumTerm" name="objectivesMediumTerm" class="w-full" rows="2"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Residencia</label>
          <input [(ngModel)]="form.residence" name="residence" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Limitaciones</label>
          <textarea [(ngModel)]="form.limitations" name="limitations" class="w-full" rows="2"></textarea>
        </div>

        <h3 class="text-sm font-semibold text-primary-600">Equipamiento</h3>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs text-primary-400 mb-1">Reloj</label>
            <input [(ngModel)]="equipWatch" name="equipWatch" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-primary-400 mb-1">Banda FC</label>
            <input [(ngModel)]="equipBand" name="equipBand" class="w-full" />
          </div>
          <div>
            <label class="block text-xs text-primary-400 mb-1">Bicicleta</label>
            <input [(ngModel)]="equipBike" name="equipBike" class="w-full" />
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
export class MetricsFormComponent implements OnInit {
  dialogRef = inject(DialogRef<boolean>);
  data: { athleteId: string; metrics?: AthleteMetrics | null } = inject(DIALOG_DATA);
  private metricsService = inject(AthleteMetricsService);
  private toast = inject(ToastService);

  isEdit = false;
  form: any = {};
  equipWatch = '';
  equipBand = '';
  equipBike = '';

  ngOnInit() {
    if (this.data.metrics) {
      this.isEdit = true;
      const m = this.data.metrics;
      this.form = {
        age: m.age,
        vam: m.vam,
        vt2: m.vt2,
        fcMax: m.fcMax,
        weeklyAvailableHours: m.weeklyAvailableHours,
        objectivesShortTerm: m.objectivesShortTerm || '',
        objectivesMediumTerm: m.objectivesMediumTerm || '',
        residence: m.residence || '',
        limitations: m.limitations || '',
      };
      this.equipWatch = m.equipment?.watch || '';
      this.equipBand = m.equipment?.heartRateBand || '';
      this.equipBike = m.equipment?.bike || '';
    }
  }

  onSubmit() {
    const payload = {
      ...this.form,
      equipment: {
        watch: this.equipWatch || undefined,
        heartRateBand: this.equipBand || undefined,
        bike: this.equipBike || undefined,
      },
    };

    if (this.isEdit) {
      this.metricsService.update(this.data.metrics!._id, payload).subscribe({
        next: () => { this.toast.success('Métricas actualizadas'); this.dialogRef.close(true); },
        error: () => this.toast.error('Error al guardar las métricas'),
      });
    } else {
      this.metricsService.create({ ...payload, athleteId: this.data.athleteId }).subscribe({
        next: () => { this.toast.success('Métricas creadas'); this.dialogRef.close(true); },
        error: () => this.toast.error('Error al crear las métricas'),
      });
    }
  }
}
