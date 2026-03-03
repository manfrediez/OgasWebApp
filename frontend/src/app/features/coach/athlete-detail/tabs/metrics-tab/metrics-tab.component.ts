import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { AthleteMetricsService } from '../../../../../services/athlete-metrics.service';
import { AthleteMetrics } from '../../../../../models/athlete-metrics.model';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../../../shared/pipes/date-es.pipe';
import { MetricsFormComponent } from '../../../forms/metrics-form/metrics-form.component';

@Component({
  selector: 'app-metrics-tab',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div>
      <div class="flex justify-end mb-4">
        <button
          (click)="openForm()"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          {{ metrics() ? 'Editar Métricas' : '+ Crear Métricas' }}
        </button>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!metrics()) {
        <app-empty-state icon="📈" message="Sin métricas" submessage="Cargá las métricas del atleta" />
      } @else {
        <div class="card-glass rounded-xl p-6 space-y-6">
          <!-- Datos principales -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @if (metrics()!.age) {
              <div class="bg-white/30 rounded-lg p-3">
                <p class="text-xs text-primary-400">Edad</p>
                <p class="text-lg font-bold text-primary-700">{{ metrics()!.age }}</p>
              </div>
            }
            @if (metrics()!.vam) {
              <div class="bg-white/30 rounded-lg p-3">
                <p class="text-xs text-primary-400">VAM</p>
                <p class="text-lg font-bold text-primary-700">{{ metrics()!.vam }}</p>
              </div>
            }
            @if (metrics()!.vt2) {
              <div class="bg-white/30 rounded-lg p-3">
                <p class="text-xs text-primary-400">VT2</p>
                <p class="text-lg font-bold text-primary-700">{{ metrics()!.vt2 }}</p>
              </div>
            }
            @if (metrics()!.fcMax) {
              <div class="bg-white/30 rounded-lg p-3">
                <p class="text-xs text-primary-400">FC Max</p>
                <p class="text-lg font-bold text-primary-700">{{ metrics()!.fcMax }}</p>
              </div>
            }
          </div>

          <!-- Objetivos -->
          @if (metrics()!.objectivesShortTerm || metrics()!.objectivesMediumTerm) {
            <div>
              <h3 class="text-sm font-semibold text-primary-600 mb-2">Objetivos</h3>
              @if (metrics()!.objectivesShortTerm) {
                <p class="text-sm text-primary-500"><span class="font-medium">Corto plazo:</span> {{ metrics()!.objectivesShortTerm }}</p>
              }
              @if (metrics()!.objectivesMediumTerm) {
                <p class="text-sm text-primary-500 mt-1"><span class="font-medium">Mediano plazo:</span> {{ metrics()!.objectivesMediumTerm }}</p>
              }
            </div>
          }

          <!-- Zonas FC detalladas -->
          @if (metrics()!.hrZonesDetailed && metrics()!.hrZonesDetailed!.length > 0) {
            <div>
              <h3 class="text-sm font-semibold text-primary-600 mb-2">Zonas de Frecuencia Cardíaca</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-surface-alt">
                      <th class="text-left px-3 py-2 font-medium text-primary-600">Zona</th>
                      <th class="text-left px-3 py-2 font-medium text-primary-600">% FC</th>
                      <th class="text-left px-3 py-2 font-medium text-primary-600">Rango FC</th>
                      <th class="text-left px-3 py-2 font-medium text-primary-600">Sensación</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (zone of metrics()!.hrZonesDetailed; track zone.zone) {
                      <tr class="border-b border-primary-50">
                        <td class="px-3 py-2 font-medium">{{ zone.zone }}</td>
                        <td class="px-3 py-2">{{ zone.percentRange }}</td>
                        <td class="px-3 py-2">
                          @if (zone.fcRange) {
                            {{ zone.fcRange.min }} - {{ zone.fcRange.max }}
                          }
                        </td>
                        <td class="px-3 py-2">{{ zone.sensation }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Test History -->
          @if (metrics()!.testHistory && metrics()!.testHistory!.length > 0) {
            <div>
              <h3 class="text-sm font-semibold text-primary-600 mb-2">Historial de Tests</h3>
              <div class="space-y-2">
                @for (test of metrics()!.testHistory; track $index) {
                  <div class="bg-white/30 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-primary-700">{{ test.type }}</p>
                      <p class="text-xs text-primary-400">{{ test.date | dateEs }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-bold text-primary-700">{{ test.value }}</p>
                      @if (test.pace) {
                        <p class="text-xs text-primary-400">{{ test.pace }}</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MetricsTabComponent implements OnInit {
  private metricsService = inject(AthleteMetricsService);
  private dialog = inject(Dialog);

  athleteId = input.required<string>();
  metrics = signal<AthleteMetrics | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.metricsService.getByAthlete(this.athleteId()).subscribe({
      next: m => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    const ref = this.dialog.open(MetricsFormComponent, {
      data: { athleteId: this.athleteId(), metrics: this.metrics() },
      panelClass: 'flex items-center justify-center p-4',
    });
    ref.closed.subscribe(result => {
      if (result) this.loadMetrics();
    });
  }
}
