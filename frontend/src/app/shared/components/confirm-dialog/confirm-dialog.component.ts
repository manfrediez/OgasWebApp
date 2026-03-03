import { Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="bg-surface rounded-xl p-6 shadow-xl max-w-md w-full">
      <h3 class="text-lg font-semibold text-primary-700 mb-2">{{ data.title }}</h3>
      <p class="text-sm text-primary-500 mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-3">
        <button
          (click)="dialogRef.close(false)"
          class="rounded-lg border border-primary-200 px-4 py-2 text-sm text-primary-600 hover:bg-surface-alt">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          (click)="dialogRef.close(true)"
          class="rounded-lg bg-danger-500 px-4 py-2 text-sm text-white hover:bg-danger-600">
          {{ data.confirmText || 'Eliminar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  dialogRef = inject(DialogRef<boolean>);
  data: ConfirmDialogData = inject(DIALOG_DATA);
}
