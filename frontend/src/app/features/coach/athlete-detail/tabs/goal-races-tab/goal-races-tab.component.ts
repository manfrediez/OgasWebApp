import { Component, inject, input, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { GoalRacesService } from '../../../../../services/goal-races.service';
import { GoalRace } from '../../../../../models/goal-race.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { DateEsPipe } from '../../../../../shared/pipes/date-es.pipe';
import { GoalRaceFormComponent } from '../../../forms/goal-race-form/goal-race-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-goal-races-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, ErrorStateComponent, DateEsPipe],
  template: `
    <div>
      <div class="flex justify-end mb-4">
        <button
          (click)="openForm()"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Nueva Carrera
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (errorState()) {
        <app-error-state (retry)="loadRaces()" />
      } @else if (races().length === 0) {
        <app-empty-state icon="🏁" message="Sin carreras objetivo" submessage="Agregá una carrera objetivo"
          actionLabel="Nueva Carrera" (actionClick)="openForm()" />
      } @else {
        <div class="space-y-3">
          @for (race of races(); track race._id) {
            <div class="card-glass rounded-xl p-4">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-semibold text-primary-700">{{ race.name }}</h3>
                  <p class="text-sm text-primary-400">{{ race.distance }} - {{ race.date | dateEs }}</p>
                  @if (race.location) {
                    <p class="text-xs text-primary-400 mt-1">📍 {{ race.location }}</p>
                  }
                </div>
                <div class="flex gap-2">
                  <button (click)="openForm(race)" class="text-xs text-accent-500 hover:text-accent-700">Editar</button>
                  <button (click)="confirmDelete(race)" class="text-xs text-danger-500 hover:text-danger-600">Eliminar</button>
                </div>
              </div>
              @if (race.result) {
                <div class="mt-3 flex gap-4 text-sm">
                  @if (race.result.time) {
                    <span class="text-primary-500"><span class="font-medium">Tiempo:</span> {{ race.result.time }}</span>
                  }
                  @if (race.result.generalPosition) {
                    <span class="text-primary-500"><span class="font-medium">Pos. General:</span> {{ race.result.generalPosition }}</span>
                  }
                  @if (race.result.categoryPosition) {
                    <span class="text-primary-500"><span class="font-medium">Pos. Categoría:</span> {{ race.result.categoryPosition }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class GoalRacesTabComponent implements OnInit {
  private racesService = inject(GoalRacesService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  athleteId = input.required<string>();
  races = signal<GoalRace[]>([]);
  loading = signal(true);
  errorState = signal(false);

  ngOnInit() {
    this.loadRaces();
  }

  loadRaces() {
    this.loading.set(true);
    this.errorState.set(false);
    this.racesService.getByAthlete(this.athleteId()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: races => {
        this.races.set(races);
        this.loading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.loading.set(false);
      },
    });
  }

  openForm(race?: GoalRace) {
    const ref = this.dialog.open(GoalRaceFormComponent, {
      data: { athleteId: this.athleteId(), race },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(result => {
      if (result) this.loadRaces();
    });
  }

  confirmDelete(race: GoalRace) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar carrera',
        message: `¿Estás seguro de eliminar "${race.name}"?`,
      } as ConfirmDialogData,
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(confirmed => {
      if (confirmed) {
        this.racesService.delete(race._id).subscribe({
          next: () => { this.toast.success('Carrera eliminada'); this.loadRaces(); },
          error: () => this.toast.error('Error al eliminar carrera'),
        });
      }
    });
  }
}
