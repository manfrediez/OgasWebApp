import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="card-glass-static rounded-2xl p-8 flex flex-col items-center justify-center py-12 text-primary-400">
      <span class="text-4xl mb-3">{{ icon() }}</span>
      <p class="text-lg font-medium">{{ message() }}</p>
      @if (submessage()) {
        <p class="text-sm mt-1">{{ submessage() }}</p>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input('📭');
  message = input('No hay datos');
  submessage = input('');
}
