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
                <div class="flex items-center gap-2">
                  <button
                    (click)="openForm(race)"
                    title="Editar"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-accent-500 hover:bg-accent-400/10 transition-colors">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  <button
                    (click)="confirmDelete(race)"
                    [disabled]="deleting() === race._id"
                    title="Eliminar"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-danger-500 hover:bg-danger-500/10 transition-colors disabled:opacity-50">
                    @if (deleting() === race._id) {
                      <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    } @else {
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                      </svg>
                    }
                  </button>
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
  deleting = signal<string | null>(null);

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
        confirmText: 'Eliminar',
        variant: 'danger',
      } as ConfirmDialogData,
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(confirmed => {
      if (confirmed) {
        this.deleting.set(race._id);
        this.racesService.delete(race._id).subscribe({
          next: () => { this.deleting.set(null); this.toast.success('Carrera eliminada'); this.loadRaces(); },
          error: () => { this.deleting.set(null); this.toast.error('Error al eliminar carrera'); },
        });
      }
    });
  }
}
