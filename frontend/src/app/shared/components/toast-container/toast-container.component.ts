import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-fade-in flex items-center justify-between gap-3"
          [class]="getClasses(toast.type)">
          <span>{{ toast.message }}</span>
          <button
            (click)="toastService.remove(toast.id)"
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
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
        return 'bg-sky-600 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  }
}
