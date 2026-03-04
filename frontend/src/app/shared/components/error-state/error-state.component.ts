import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="card-glass-static rounded-2xl p-8 flex flex-col items-center justify-center py-12 text-primary-400">
      <span class="text-4xl mb-3">⚠️</span>
      <p class="text-lg font-medium text-primary-600">{{ message() }}</p>
      <button (click)="retry.emit()" class="btn-accent mt-4 inline-flex items-center gap-2 text-sm">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 14.652" />
        </svg>
        Reintentar
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  message = input('Error al cargar los datos');
  retry = output<void>();
}
