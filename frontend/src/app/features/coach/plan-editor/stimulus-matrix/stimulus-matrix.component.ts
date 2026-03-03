import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WeeklyStimulusEntry } from '../../../../models/workout-plan.model';

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

@Component({
  selector: 'app-stimulus-matrix',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card-glass rounded-xl p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-primary-600">Estímulos Semanales</h3>
        <button type="button" (click)="addRow()" class="text-xs text-accent-500 hover:text-accent-700">+ Actividad</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-primary-50">
              <th class="text-left px-2 py-1 font-medium text-primary-600">Actividad</th>
              @for (day of dayLabels; track $index) {
                <th class="text-center px-2 py-1 font-medium text-primary-600 w-8">{{ day }}</th>
              }
              <th class="w-8"></th>
            </tr>
          </thead>
          <tbody>
            @for (entry of stimuli(); track $index) {
              <tr class="border-b border-primary-50">
                <td class="px-2 py-1">
                  <input
                    [(ngModel)]="entry.activity"
                    (ngModelChange)="emitChange()"
                    class="w-full text-xs border-none bg-transparent p-0 focus:ring-0"
                    placeholder="Actividad..." />
                </td>
                @for (day of entry.days; track dayIdx; let dayIdx = $index) {
                  <td class="text-center px-1 py-1">
                    <input
                      type="checkbox"
                      [checked]="day"
                      (change)="toggleDay($index, dayIdx)"
                      class="h-4 w-4 rounded border-primary-300 text-accent-500 focus:ring-accent-500" />
                  </td>
                }
                <td class="px-1">
                  <button type="button" (click)="removeRow($index)" class="text-xs text-danger-500">X</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class StimulusMatrixComponent {
  stimuli = input.required<WeeklyStimulusEntry[]>();
  stimuliChange = output<WeeklyStimulusEntry[]>();

  dayLabels = DAY_LABELS;

  addRow() {
    const updated = [...this.stimuli(), { activity: '', days: [false, false, false, false, false, false, false] }];
    this.stimuliChange.emit(updated);
  }

  removeRow(i: number) {
    const updated = this.stimuli().filter((_, idx) => idx !== i);
    this.stimuliChange.emit(updated);
  }

  toggleDay(rowIdx: number, dayIdx: number) {
    const updated = this.stimuli().map((entry, i) => {
      if (i !== rowIdx) return entry;
      const newDays = [...entry.days];
      newDays[dayIdx] = !newDays[dayIdx];
      return { ...entry, days: newDays };
    });
    this.stimuliChange.emit(updated);
  }

  emitChange() {
    this.stimuliChange.emit([...this.stimuli()]);
  }
}
