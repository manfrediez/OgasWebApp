import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AthleteMetricsService } from '../../../services/athlete-metrics.service';
import { AthleteMetrics } from '../../../models/athlete-metrics.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-my-metrics',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (!metrics()) {
      <app-empty-state icon="📈" message="Sin métricas disponibles" submessage="Tu coach cargará tus datos pronto" />
    } @else {
      <div>
        <h1 class="text-xl font-bold text-primary-700 mb-4">Mis Métricas</h1>

        <!-- Key values -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          @if (metrics()!.age) {
            <div class="card-glass rounded-xl p-4 text-center">
              <p class="text-xs text-primary-400">Edad</p>
              <p class="text-2xl font-bold text-primary-700">{{ metrics()!.age }}</p>
            </div>
          }
          @if (metrics()!.vam) {
            <div class="card-glass rounded-xl p-4 text-center">
              <p class="text-xs text-primary-400">VAM</p>
              <p class="text-2xl font-bold text-accent-500">{{ metrics()!.vam }}</p>
            </div>
          }
          @if (metrics()!.vt2) {
            <div class="card-glass rounded-xl p-4 text-center">
              <p class="text-xs text-primary-400">VT2</p>
              <p class="text-2xl font-bold text-accent-500">{{ metrics()!.vt2 }}</p>
            </div>
          }
          @if (metrics()!.fcMax) {
            <div class="card-glass rounded-xl p-4 text-center">
              <p class="text-xs text-primary-400">FC Max</p>
              <p class="text-2xl font-bold text-danger-500">{{ metrics()!.fcMax }}</p>
            </div>
          }
        </div>

        <!-- Objectives -->
        @if (metrics()!.objectivesShortTerm || metrics()!.objectivesMediumTerm) {
          <div class="card-glass rounded-xl p-4 mb-4">
            <h3 class="text-sm font-semibold text-primary-600 mb-2">Objetivos</h3>
            @if (metrics()!.objectivesShortTerm) {
              <p class="text-sm text-primary-500 mb-1"><span class="font-medium">Corto plazo:</span> {{ metrics()!.objectivesShortTerm }}</p>
            }
            @if (metrics()!.objectivesMediumTerm) {
              <p class="text-sm text-primary-500"><span class="font-medium">Mediano plazo:</span> {{ metrics()!.objectivesMediumTerm }}</p>
            }
          </div>
        }

        <!-- Personal info -->
        <div class="card-glass rounded-xl p-4 mb-4">
          <h3 class="text-sm font-semibold text-primary-600 mb-2">Datos Personales</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            @if (metrics()!.residence) {
              <p class="text-primary-500"><span class="font-medium">Residencia:</span> {{ metrics()!.residence }}</p>
            }
            @if (metrics()!.weeklyAvailableHours) {
              <p class="text-primary-500"><span class="font-medium">Horas semanales:</span> {{ metrics()!.weeklyAvailableHours }}h</p>
            }
            @if (metrics()!.limitations) {
              <p class="text-primary-500 col-span-2"><span class="font-medium">Limitaciones:</span> {{ metrics()!.limitations }}</p>
            }
          </div>
        </div>

        <!-- Equipment -->
        @if (metrics()!.equipment) {
          <div class="card-glass rounded-xl p-4 mb-4">
            <h3 class="text-sm font-semibold text-primary-600 mb-2">Equipamiento</h3>
            <div class="grid grid-cols-3 gap-3 text-sm">
              @if (metrics()!.equipment!.watch) {
                <p class="text-primary-500"><span class="font-medium">Reloj:</span> {{ metrics()!.equipment!.watch }}</p>
              }
              @if (metrics()!.equipment!.heartRateBand) {
                <p class="text-primary-500"><span class="font-medium">Banda FC:</span> {{ metrics()!.equipment!.heartRateBand }}</p>
              }
              @if (metrics()!.equipment!.bike) {
                <p class="text-primary-500"><span class="font-medium">Bicicleta:</span> {{ metrics()!.equipment!.bike }}</p>
              }
            </div>
          </div>
        }

        <!-- HR Zones -->
        @if (metrics()!.hrZonesDetailed && metrics()!.hrZonesDetailed!.length > 0) {
          <div class="card-glass rounded-xl p-4 mb-4">
            <h3 class="text-sm font-semibold text-primary-600 mb-2">Zonas de Frecuencia Cardíaca</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-surface-alt">
                    <th class="text-left px-3 py-2 font-medium text-primary-600">Zona</th>
                    <th class="text-left px-3 py-2 font-medium text-primary-600">% FC</th>
                    <th class="text-left px-3 py-2 font-medium text-primary-600">Rango FC</th>
                    <th class="text-left px-3 py-2 font-medium text-primary-600">Sensación</th>
                    <th class="text-left px-3 py-2 font-medium text-primary-600">RPE</th>
                  </tr>
                </thead>
                <tbody>
                  @for (zone of metrics()!.hrZonesDetailed; track zone.zone) {
                    <tr class="border-b border-primary-50">
                      <td class="px-3 py-2 font-medium">{{ zone.zone }}</td>
                      <td class="px-3 py-2">{{ zone.percentRange }}</td>
                      <td class="px-3 py-2">
                        @if (zone.fcRange) { {{ zone.fcRange.min }} - {{ zone.fcRange.max }} }
                      </td>
                      <td class="px-3 py-2">{{ zone.sensation }}</td>
                      <td class="px-3 py-2">{{ zone.rpe }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Test history -->
        @if (metrics()!.testHistory && metrics()!.testHistory!.length > 0) {
          <div class="card-glass rounded-xl p-4">
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
                      <p class="text-xs text-primary-400">Ritmo: {{ test.pace }}</p>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class MyMetricsComponent implements OnInit {
  private authService = inject(AuthService);
  private metricsService = inject(AthleteMetricsService);

  metrics = signal<AthleteMetrics | null>(null);
  loading = signal(true);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.metricsService.getByAthlete(user._id).subscribe({
      next: m => {
        this.metrics.set(m);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
