import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="region" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast-glass rounded-xl px-4 py-3 text-sm font-medium animate-fade-in flex items-center justify-between gap-3"
          [class]="getClasses(toast.type)">
          <span>{{ toast.message }}</span>
          <button
            (click)="toastService.remove(toast.id)"
            aria-label="Cerrar notificación"
            class="opacity-70 hover:opacity-100 text-lg leading-none">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
  `],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500 text-green-800';
      case 'error':
        return 'border-l-4 border-l-red-500 text-red-800';
      case 'info':
        return 'border-l-4 border-l-sky-500 text-sky-800';
      default:
        return 'border-l-4 border-l-gray-500 text-gray-800';
    }
  }
}
