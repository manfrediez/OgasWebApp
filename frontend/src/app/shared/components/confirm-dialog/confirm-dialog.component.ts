import { Component, inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog-glass rounded-2xl p-6 max-w-md w-full">
      <h3 id="dialog-title" class="text-lg font-semibold text-primary-700 mb-2">{{ data.title }}</h3>
      <p class="text-sm text-primary-500 mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-3">
        <button
          (click)="dialogRef.close(false)"
          class="btn-secondary">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          (click)="dialogRef.close(true)"
          [class]="data.variant === 'danger' ? 'btn-danger' : 'btn-primary'">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  dialogRef = inject(DialogRef<boolean>);
  data: ConfirmDialogData = inject(DIALOG_DATA);
}
