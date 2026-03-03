import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { StrengthCircuitsService } from '../../../../services/strength-circuits.service';
import { StrengthCircuit, Exercise } from '../../../../models/strength-circuit.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-strength-circuit-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-surface rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <h2 class="text-lg font-bold text-primary-700 mb-4">
        {{ isEdit ? 'Editar Circuito' : 'Nuevo Circuito de Fuerza' }}
      </h2>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Nombre</label>
            <input [(ngModel)]="form.name" name="name" required class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Nro. Circuito</label>
            <input [(ngModel)]="form.circuitNumber" name="circuitNumber" type="number" required class="w-full" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Nro. Rutina</label>
            <input [(ngModel)]="form.routineNumber" name="routineNumber" type="number" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Timer</label>
            <input [(ngModel)]="form.timerFormat" name="timerFormat" class="w-full" placeholder="40''X15''X16" />
          </div>
        </div>

        <!-- Ejercicios -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-semibold text-primary-600">Ejercicios</label>
            <button type="button" (click)="addExercise()" class="text-xs text-accent-500 hover:text-accent-700">+ Agregar</button>
          </div>
          @for (ex of exercises; track $index) {
            <div class="bg-surface-alt rounded-lg p-3 mb-2 space-y-2">
              <div class="flex items-center justify-between">
                <input [(ngModel)]="ex.name" [name]="'exName' + $index" placeholder="Nombre del ejercicio" class="flex-1 mr-2" />
                <button type="button" (click)="removeExercise($index)" class="text-xs text-danger-500">X</button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs text-primary-400">Series</label>
                  <input [(ngModel)]="ex.sets" [name]="'exSets' + $index" type="number" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs text-primary-400">Reps</label>
                  <input [(ngModel)]="ex.reps" [name]="'exReps' + $index" class="w-full" placeholder="8-12" />
                </div>
                <div>
                  <label class="block text-xs text-primary-400">Notas</label>
                  <input [(ngModel)]="ex.notes" [name]="'exNotes' + $index" class="w-full" />
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
export class StrengthCircuitFormComponent implements OnInit {
  dialogRef = inject(DialogRef<boolean>);
  data: { circuit?: StrengthCircuit } = inject(DIALOG_DATA);
  private circuitsService = inject(StrengthCircuitsService);
  private toast = inject(ToastService);

  isEdit = false;
  form = { name: '', circuitNumber: 1, routineNumber: null as number | null, timerFormat: '' };
  exercises: Exercise[] = [];

  ngOnInit() {
    if (this.data.circuit) {
      this.isEdit = true;
      const c = this.data.circuit;
      this.form = { name: c.name, circuitNumber: c.circuitNumber, routineNumber: c.routineNumber ?? null, timerFormat: c.timerFormat || '' };
      this.exercises = [...c.exercises];
    }
  }

  addExercise() {
    this.exercises.push({ name: '' });
  }

  removeExercise(i: number) {
    this.exercises.splice(i, 1);
  }

  onSubmit() {
    const payload = {
      ...this.form,
      routineNumber: this.form.routineNumber ?? undefined,
      timerFormat: this.form.timerFormat || undefined,
      exercises: this.exercises,
    };
    if (this.isEdit) {
      this.circuitsService.update(this.data.circuit!._id, payload).subscribe({
        next: () => { this.toast.success('Circuito actualizado'); this.dialogRef.close(true); },
        error: () => this.toast.error('Error al guardar el circuito'),
      });
    } else {
      this.circuitsService.create(payload).subscribe({
        next: () => { this.toast.success('Circuito creado'); this.dialogRef.close(true); },
        error: () => this.toast.error('Error al crear el circuito'),
      });
    }
  }
}
