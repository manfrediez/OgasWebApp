import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center py-12" role="status" aria-live="polite">
      <div class="h-14 w-14 rounded-full bg-surface border border-primary-200 flex items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-accent-500"></div>
      </div>
      <span class="sr-only">Cargando...</span>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
