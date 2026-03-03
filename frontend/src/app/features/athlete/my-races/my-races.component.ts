import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { GoalRacesService } from '../../../services/goal-races.service';
import { RaceStrategiesService } from '../../../services/race-strategies.service';
import { GoalRace } from '../../../models/goal-race.model';
import { RaceStrategy } from '../../../models/race-strategy.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-my-races',
  standalone: true,
  imports: [LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div>
        <h1 class="text-xl font-bold text-primary-700 mb-4">Mis Carreras</h1>

        <!-- Goal races -->
        <h2 class="text-sm font-semibold text-primary-600 mb-2">Carreras Objetivo</h2>
        @if (races().length === 0) {
          <app-empty-state icon="🏁" message="Sin carreras objetivo" />
        } @else {
          <div class="space-y-3 mb-8">
            @for (race of races(); track race._id) {
              <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50">
                <h3 class="font-semibold text-primary-700">{{ race.name }}</h3>
                <p class="text-sm text-primary-400">{{ race.distance }} - {{ race.date | dateEs }}</p>
                @if (race.location) {
                  <p class="text-xs text-primary-400">📍 {{ race.location }}</p>
                }
                @if (race.result) {
                  <div class="mt-2 flex gap-4 text-sm">
                    @if (race.result.time) {
                      <span class="text-primary-500">Tiempo: {{ race.result.time }}</span>
                    }
                    @if (race.result.generalPosition) {
                      <span class="text-primary-500">Pos.: {{ race.result.generalPosition }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Published strategies -->
        <h2 class="text-sm font-semibold text-primary-600 mb-2">Estrategias de Carrera</h2>
        @if (publishedStrategies().length === 0) {
          <app-empty-state icon="🗺️" message="Sin estrategias publicadas" submessage="Tu coach publicará las estrategias cuando estén listas" />
        } @else {
          <div class="space-y-3">
            @for (s of publishedStrategies(); track s._id) {
              <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50">
                <h3 class="font-semibold text-primary-700">{{ s.raceName }}</h3>
                <p class="text-sm text-primary-400">{{ s.raceDate | dateEs }} - {{ s.totalDistance }} km</p>

                @if (s.preRaceActivation) {
                  <div class="mt-3">
                    <p class="text-xs font-medium text-primary-500">Activación pre-carrera:</p>
                    <p class="text-sm text-primary-600">{{ s.preRaceActivation }}</p>
                  </div>
                }

                @if (s.segments && s.segments.length > 0) {
                  <div class="mt-3">
                    <p class="text-xs font-medium text-primary-500 mb-1">Segmentos:</p>
                    @for (seg of s.segments; track $index) {
                      <div class="bg-surface-alt rounded-lg p-2 mb-1 text-sm">
                        <span class="font-medium text-primary-600">Km {{ seg.fromKm }}-{{ seg.toKm }}:</span>
                        @if (seg.objective) {
                          <span class="text-primary-500"> {{ seg.objective }}</span>
                        }
                        @if (seg.paceZone) {
                          <span class="text-accent-500"> ({{ seg.paceZone }})</span>
                        }
                      </div>
                    }
                  </div>
                }

                @if (s.generalTechnique) {
                  <div class="mt-3">
                    <p class="text-xs font-medium text-primary-500">Técnica general:</p>
                    <p class="text-sm text-primary-600">{{ s.generalTechnique }}</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class MyRacesComponent implements OnInit {
  private authService = inject(AuthService);
  private racesService = inject(GoalRacesService);
  private strategiesService = inject(RaceStrategiesService);

  races = signal<GoalRace[]>([]);
  publishedStrategies = signal<RaceStrategy[]>([]);
  loading = signal(true);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 2) this.loading.set(false); };

    this.racesService.getByAthlete(user._id).subscribe({
      next: r => { this.races.set(r); checkDone(); },
      error: () => checkDone(),
    });

    this.strategiesService.getByAthlete(user._id).subscribe({
      next: s => {
        this.publishedStrategies.set(s.filter(st => st.isPublished));
        checkDone();
      },
      error: () => checkDone(),
    });
  }
}
