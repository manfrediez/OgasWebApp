import { Component, inject, input, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { RaceStrategiesService } from '../../../../../services/race-strategies.service';
import { RaceStrategy } from '../../../../../models/race-strategy.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { DateEsPipe } from '../../../../../shared/pipes/date-es.pipe';
import { RaceStrategyFormComponent } from '../../../forms/race-strategy-form/race-strategy-form.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-race-strategies-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, ErrorStateComponent, DateEsPipe],
  template: `
    <div>
      <div class="flex justify-end mb-4">
        <button
          (click)="openForm()"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Nueva Estrategia
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (errorState()) {
        <app-error-state (retry)="loadStrategies()" />
      } @else if (strategies().length === 0) {
        <app-empty-state icon="🗺️" message="Sin estrategias" submessage="Creá una estrategia de carrera"
          actionLabel="Nueva Estrategia" (actionClick)="openForm()" />
      } @else {
        <div class="space-y-3">
          @for (s of strategies(); track s._id) {
            <div class="card-glass rounded-xl p-4">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-primary-700">{{ s.raceName }}</h3>
                    @if (s.isPublished) {
                      <span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Publicada</span>
                    } @else {
                      <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Borrador</span>
                    }
                  </div>
                  <p class="text-sm text-primary-400">{{ s.raceDate | dateEs }} - {{ s.totalDistance }} km</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    (click)="openForm(s)"
                    title="Editar"
                    class="p-1.5 rounded-lg text-primary-400 hover:text-accent-500 hover:bg-accent-400/10 transition-colors">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                    </svg>
                  </button>
                  @if (!s.isPublished) {
                    <button
                      (click)="publish(s)"
                      [disabled]="publishing() === s._id"
                      title="Publicar"
                      class="p-1.5 rounded-lg text-primary-400 hover:text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-50">
                      @if (publishing() === s._id) {
                        <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      } @else {
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/>
                        </svg>
                      }
                    </button>
                  }
                </div>
              </div>

              @if (s.segments && s.segments.length > 0) {
                <div class="mt-3">
                  <p class="text-xs font-medium text-primary-500 mb-1">Segmentos:</p>
                  <div class="flex flex-wrap gap-2">
                    @for (seg of s.segments; track $index) {
                      <span class="text-xs bg-primary-50 rounded px-2 py-1 text-primary-500">
                        Km {{ seg.fromKm }}-{{ seg.toKm }}
                        @if (seg.paceZone) { ({{ seg.paceZone }}) }
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class RaceStrategiesTabComponent implements OnInit {
  private strategiesService = inject(RaceStrategiesService);
  private dialog = inject(Dialog);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  athleteId = input.required<string>();
  strategies = signal<RaceStrategy[]>([]);
  loading = signal(true);
  errorState = signal(false);
  publishing = signal<string | null>(null);

  ngOnInit() {
    this.loadStrategies();
  }

  loadStrategies() {
    this.loading.set(true);
    this.errorState.set(false);
    this.strategiesService.getByAthlete(this.athleteId()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: s => {
        this.strategies.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.errorState.set(true);
        this.loading.set(false);
      },
    });
  }

  openForm(strategy?: RaceStrategy) {
    const ref = this.dialog.open(RaceStrategyFormComponent, {
      data: { athleteId: this.athleteId(), strategy },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(result => {
      if (result) this.loadStrategies();
    });
  }

  publish(strategy: RaceStrategy) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Publicar estrategia',
        message: `¿Publicar "${strategy.raceName}"? El atleta podrá verla. Esta acción no se puede deshacer.`,
        confirmText: 'Publicar',
      } as ConfirmDialogData,
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe(confirmed => {
      if (confirmed) {
        this.publishing.set(strategy._id);
        this.strategiesService.publish(strategy._id).subscribe({
          next: () => { this.publishing.set(null); this.toast.success('Estrategia publicada'); this.loadStrategies(); },
          error: () => { this.publishing.set(null); this.toast.error('Error al publicar'); },
        });
      }
    });
  }
}
