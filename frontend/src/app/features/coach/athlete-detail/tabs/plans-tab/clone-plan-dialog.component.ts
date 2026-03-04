import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { UsersService } from '../../../../../services/users.service';
import { User } from '../../../../../core/models/user.model';

export interface ClonePlanDialogData {
  planName: string;
  currentAthleteId: string;
}

@Component({
  selector: 'app-clone-plan-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" class="dialog-glass rounded-2xl p-6 max-w-md w-full">
      <h3 id="dialog-title" class="text-lg font-semibold text-primary-700 mb-2">Clonar Plan</h3>
      <p class="text-sm text-primary-400 mb-4">
        Clonar "{{ data.planName }}" a otro atleta. Se resetearán los feedbacks y estados.
      </p>

      @if (loading()) {
        <p class="text-sm text-primary-400">Cargando atletas...</p>
      } @else {
        <div class="mb-4">
          <label class="block text-sm font-medium text-primary-600 mb-1">Atleta destino</label>
          <select [(ngModel)]="selectedAthleteId" class="w-full">
            <option value="">Seleccioná un atleta</option>
            @for (a of athletes(); track a._id) {
              <option [value]="a._id">{{ a.firstName }} {{ a.lastName }}</option>
            }
          </select>
        </div>
      }

      <div class="flex justify-end gap-3">
        <button
          (click)="dialogRef.close(null)"
          class="btn-secondary">
          Cancelar
        </button>
        <button
          (click)="confirm()"
          [disabled]="!selectedAthleteId"
          class="btn-accent">
          Clonar
        </button>
      </div>
    </div>
  `,
})
export class ClonePlanDialogComponent implements OnInit {
  dialogRef = inject(DialogRef<string | null>);
  data: ClonePlanDialogData = inject(DIALOG_DATA);
  private usersService = inject(UsersService);
  private destroyRef = inject(DestroyRef);

  athletes = signal<User[]>([]);
  loading = signal(true);
  selectedAthleteId = '';

  ngOnInit() {
    this.usersService.getAthletes().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (athletes) => {
        this.athletes.set(
          athletes.filter((a) => a._id !== this.data.currentAthleteId && a.isActive),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirm() {
    if (this.selectedAthleteId) {
      this.dialogRef.close(this.selectedAthleteId);
    }
  }
}
