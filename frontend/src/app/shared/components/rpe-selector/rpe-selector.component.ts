import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-rpe-selector',
  standalone: true,
  template: `
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-primary-600">RPE (Percepción de esfuerzo)</label>
      <div class="flex gap-1">
        @for (val of values; track val) {
          <button
            type="button"
            (click)="valueChange.emit(val)"
            [class]="getButtonClass(val)">
            {{ val }}
          </button>
        }
      </div>
    </div>
  `,
})
export class RpeSelectorComponent {
  value = input<number | null>(null);
  valueChange = output<number>();

  values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  rpeColor = computed(() => {
    const v = this.value();
    if (!v) return '';
    if (v <= 3) return 'green';
    if (v <= 6) return 'yellow';
    if (v <= 8) return 'orange';
    return 'red';
  });

  getButtonClass(val: number): string {
    const base = 'w-8 h-8 rounded-lg text-xs font-bold transition-all';
    const current = this.value();

    if (current === val) {
      if (val <= 3) return `${base} bg-green-500 text-white`;
      if (val <= 6) return `${base} bg-yellow-500 text-white`;
      if (val <= 8) return `${base} bg-orange-500 text-white`;
      return `${base} bg-red-500 text-white`;
    }

    return `${base} bg-surface-alt text-primary-500 hover:bg-primary-100`;
  }
}
