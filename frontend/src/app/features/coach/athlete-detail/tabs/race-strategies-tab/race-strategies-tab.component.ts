import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { RaceStrategiesService } from '../../../../../services/race-strategies.service';
import { RaceStrategy } from '../../../../../models/race-strategy.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../../../shared/pipes/date-es.pipe';
import { RaceStrategyFormComponent } from '../../../forms/race-strategy-form/race-strategy-form.component';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
  selector: 'app-race-strategies-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
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
      } @else if (strategies().length === 0) {
        <app-empty-state icon="🗺️" message="Sin estrategias" submessage="Creá una estrategia de carrera" />
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
                <div class="flex gap-2">
                  <button (click)="openForm(s)" class="text-xs text-accent-500 hover:text-accent-700">Editar</button>
                  @if (!s.isPublished) {
                    <button (click)="publish(s)" class="text-xs text-success-500 hover:text-success-600">Publicar</button>
                  }
                </div>
              </div>

              @if (s.segments && s.segments.length > 0) {
                <div class="mt-3">
                  <p class="text-xs font-medium text-primary-500 mb-1">Segmentos:</p>
                  <div class="flex flex-wrap gap-2">
                    @for (seg of s.segments; track $index) {
                      <span class="text-xs bg-white/30 rounded px-2 py-1 text-primary-500">
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

  athleteId = input.required<string>();
  strategies = signal<RaceStrategy[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadStrategies();
  }

  loadStrategies() {
    this.strategiesService.getByAthlete(this.athleteId()).subscribe({
      next: s => {
        this.strategies.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar estrategias');
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
    this.strategiesService.publish(strategy._id).subscribe({
      next: () => { this.toast.success('Estrategia publicada'); this.loadStrategies(); },
      error: () => this.toast.error('Error al publicar'),
    });
  }
}
