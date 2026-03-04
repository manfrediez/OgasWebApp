import { Component, inject, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ImportService, ImportResult } from '../../../../services/import.service';
import { ToastService } from '../../../../shared/services/toast.service';

export interface ImportExcelDialogData {
  athleteId: string;
}

@Component({
  selector: 'app-import-excel-dialog',
  standalone: true,
  template: `
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog-glass rounded-2xl p-6 w-full max-w-md">
      <h2 id="dialog-title" class="text-lg font-bold text-primary-700 mb-4">Importar Excel</h2>

      @if (!result()) {
        <div class="space-y-4">
          <p class="text-sm text-primary-400">
            Seleccioná un archivo Excel (.xlsx) con los datos del atleta para importar planes, carreras, estrategias, circuitos y métricas.
          </p>

          <div
            class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            [class]="selectedFile() ? 'border-accent-500 bg-accent-500/5' : 'border-primary-200 hover:border-primary-400'"
            (click)="fileInput.click()"
            (dragover)="$event.preventDefault()"
            (drop)="onDrop($event)">
            <input
              #fileInput
              type="file"
              accept=".xlsx"
              class="hidden"
              (change)="onFileSelected($event)" />

            @if (selectedFile()) {
              <div class="text-sm">
                <p class="font-medium text-primary-700">{{ selectedFile()!.name }}</p>
                <p class="text-primary-400 mt-1">{{ formatSize(selectedFile()!.size) }}</p>
              </div>
            } @else {
              <p class="text-sm text-primary-400">
                Arrastrá o hacé clic para seleccionar un archivo .xlsx
              </p>
            }
          </div>

          @if (error()) {
            <p class="text-sm text-danger-500">{{ error() }}</p>
          }

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="dialogRef.close()"
              class="btn-secondary">
              Cancelar
            </button>
            <button
              type="button"
              (click)="onImport()"
              [disabled]="!selectedFile() || loading()"
              class="btn-primary">
              @if (loading()) {
                <span class="inline-flex items-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Importando...
                </span>
              } @else {
                Importar
              }
            </button>
          </div>
        </div>
      } @else {
        <div class="space-y-4">
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 class="font-semibold text-green-800 dark:text-green-400 mb-2">Importación completada</h3>
            <ul class="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>{{ result()!.plans }} plan{{ result()!.plans !== 1 ? 'es' : '' }} creado{{ result()!.plans !== 1 ? 's' : '' }}</li>
              <li>{{ result()!.goalRaces }} carrera{{ result()!.goalRaces !== 1 ? 's' : '' }} objetivo creada{{ result()!.goalRaces !== 1 ? 's' : '' }}</li>
              <li>{{ result()!.strategies }} estrategia{{ result()!.strategies !== 1 ? 's' : '' }} creada{{ result()!.strategies !== 1 ? 's' : '' }}</li>
              <li>{{ result()!.circuits }} circuito{{ result()!.circuits !== 1 ? 's' : '' }} creado{{ result()!.circuits !== 1 ? 's' : '' }}</li>
              @if (result()!.metricsUpdated) {
                <li>Métricas del atleta actualizadas</li>
              }
            </ul>
          </div>
          <div class="flex justify-end">
            <button
              type="button"
              (click)="dialogRef.close(true)"
              class="btn-primary">
              Cerrar
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ImportExcelDialogComponent {
  dialogRef = inject(DialogRef<boolean>);
  data: ImportExcelDialogData = inject(DIALOG_DATA);
  private importService = inject(ImportService);
  private toast = inject(ToastService);

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  error = signal('');
  result = signal<ImportResult | null>(null);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectFile(file);
  }

  private selectFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.error.set('Solo se permiten archivos .xlsx');
      return;
    }
    this.error.set('');
    this.selectedFile.set(file);
  }

  onImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.error.set('');

    this.importService.importExcel(this.data.athleteId, file).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.result.set(res);
        this.toast.success('Excel importado correctamente');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Error al importar el archivo';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
