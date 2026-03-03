import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center py-12">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-accent-500"></div>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
