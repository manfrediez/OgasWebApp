import { Component, input } from '@angular/core';
import { Session } from '../../../../models/workout-plan.model';
import { ActivityData } from '../../../../models/activity-data.model';
import { SessionStatus } from '../../../../core/models/enums';
import { WorkoutTypeIconComponent } from '../../../../shared/components/workout-type-icon/workout-type-icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { WorkoutTypeLabelPipe } from '../../../../shared/pipes/workout-type-label.pipe';
import { HrZoneLabelPipe } from '../../../../shared/pipes/hr-zone-label.pipe';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [WorkoutTypeIconComponent, StatusBadgeComponent, WorkoutTypeLabelPipe, HrZoneLabelPipe],
  template: `
    <div class="card-glass rounded-xl p-4 space-y-3"
         [class.border-l-4]="needsFeedback()"
         [class.border-l-amber-400]="needsFeedback()">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <app-workout-type-icon [type]="session().type" />
          <span class="font-medium text-primary-700">{{ session().type | workoutTypeLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          @if (session().athletePerception) {
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
                  [class]="getRpeClass(session().athletePerception!)">
              RPE {{ session().athletePerception }}
            </span>
          } @else if (needsFeedback()) {
            <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Pendiente
            </span>
          }
          <app-status-badge [status]="session().status" />
        </div>
      </div>

      @if (session().description) {
        <p class="text-sm text-primary-600 whitespace-pre-wrap">{{ session().description }}</p>
      }

      <div class="flex flex-wrap gap-3 text-xs text-primary-400">
        @if (session().duration) {
          <span>{{ session().duration }}min</span>
        }
        @if (session().distance) {
          <span>{{ session().distance }}km</span>
        }
        @if (session().targetHRZone) {
          <span>{{ session().targetHRZone! | hrZoneLabel }}</span>
        }
      </div>

      @if (session().coachNotes) {
        <div class="bg-primary-50 rounded-lg p-3">
          <p class="text-xs font-medium text-primary-500">Notas del coach:</p>
          <p class="text-sm text-primary-600">{{ session().coachNotes }}</p>
        </div>
      }

      @if (session().competitionName) {
        <div class="bg-accent-400/10 rounded-lg p-3">
          <p class="text-xs font-medium text-accent-700">Competencia: {{ session().competitionName }}</p>
          @if (session().competitionDistance) {
            <p class="text-xs text-accent-600">{{ session().competitionDistance }} - {{ session().competitionLocation }}</p>
          }
        </div>
      }

      @if (session().alternativeDescription) {
        <div class="border-t border-primary-50 pt-2">
          <p class="text-xs text-primary-400">
            <span class="font-medium">Alternativa{{ session().alternativeLabel ? ' (' + session().alternativeLabel + ')' : '' }}:</span>
            {{ session().alternativeDescription }}
          </p>
        </div>
      }

      @if (session().athleteFeedback || session().athletePerception) {
        <div class="border-t border-primary-50 pt-2">
          <p class="text-xs font-medium text-primary-500">Mi feedback:</p>
          @if (session().athletePerception) {
            <p class="text-sm text-primary-600">RPE: {{ session().athletePerception }}/10</p>
          }
          @if (session().athleteFeedback) {
            <p class="text-sm text-primary-600">{{ session().athleteFeedback }}</p>
          }
        </div>
      }

      <!-- Activity Data (real metrics from Strava) -->
      @if (activityData(); as ad) {
        <div class="border-t border-primary-50 pt-3">
          <div class="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" class="w-4 h-4" fill="#FC4C02">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            <p class="text-xs font-semibold text-primary-600">Datos reales</p>
            @if (ad.name) {
              <span class="text-xs text-primary-400">· {{ ad.name }}</span>
            }
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            @if (ad.distance) {
              <div class="flex items-center gap-1.5">
                <span class="text-primary-400">Distancia:</span>
                <span class="font-medium" [class]="getComparisonClass(ad.distance / 1000, session().distance)">
                  {{ (ad.distance / 1000).toFixed(2) }} km
                </span>
              </div>
            }
            @if (ad.movingTime) {
              <div class="flex items-center gap-1.5">
                <span class="text-primary-400">Duración:</span>
                <span class="font-medium" [class]="getComparisonClass(ad.movingTime / 60, session().duration)">
                  {{ formatDuration(ad.movingTime) }}
                </span>
              </div>
            }
            @if (ad.averageHeartRate) {
              <div>
                <span class="text-primary-400">FC media:</span>
                <span class="font-medium text-primary-700"> {{ ad.averageHeartRate }} bpm</span>
              </div>
            }
            @if (ad.maxHeartRate) {
              <div>
                <span class="text-primary-400">FC máx:</span>
                <span class="font-medium text-primary-700"> {{ ad.maxHeartRate }} bpm</span>
              </div>
            }
            @if (ad.averagePace) {
              <div>
                <span class="text-primary-400">Ritmo:</span>
                <span class="font-medium text-primary-700"> {{ formatPace(ad.averagePace) }}/km</span>
              </div>
            }
            @if (ad.totalElevationGain) {
              <div>
                <span class="text-primary-400">Desnivel:</span>
                <span class="font-medium text-primary-700"> {{ ad.totalElevationGain }}m</span>
              </div>
            }
            @if (ad.averageCadence) {
              <div>
                <span class="text-primary-400">Cadencia:</span>
                <span class="font-medium text-primary-700"> {{ ad.averageCadence }} spm</span>
              </div>
            }
          </div>

          <!-- HR Zones Distribution -->
          @if (ad.hrZonesDistribution) {
            <div class="mt-2">
              <p class="text-xs text-primary-400 mb-1">Distribución zonas FC:</p>
              <div class="flex h-3 rounded-full overflow-hidden">
                @if (zonePercent(ad, 'z1') > 0) {
                  <div class="bg-blue-400" [style.width.%]="zonePercent(ad, 'z1')" title="Z1"></div>
                }
                @if (zonePercent(ad, 'z2') > 0) {
                  <div class="bg-green-400" [style.width.%]="zonePercent(ad, 'z2')" title="Z2"></div>
                }
                @if (zonePercent(ad, 'z3') > 0) {
                  <div class="bg-yellow-400" [style.width.%]="zonePercent(ad, 'z3')" title="Z3"></div>
                }
                @if (zonePercent(ad, 'z4') > 0) {
                  <div class="bg-orange-400" [style.width.%]="zonePercent(ad, 'z4')" title="Z4"></div>
                }
                @if (zonePercent(ad, 'z5') > 0) {
                  <div class="bg-red-500" [style.width.%]="zonePercent(ad, 'z5')" title="Z5"></div>
                }
              </div>
              <div class="flex justify-between text-[10px] text-primary-400 mt-0.5">
                <span>Z1</span><span>Z2</span><span>Z3</span><span>Z4</span><span>Z5</span>
              </div>
            </div>
          }

          <a
            [href]="'https://www.strava.com/activities/' + ad.externalId"
            target="_blank"
            rel="noopener"
            class="inline-block mt-1 text-xs font-medium hover:underline"
            style="color: #FC4C02;">
            Ver en Strava ↗
          </a>
        </div>
      }
    </div>
  `,
})
export class SessionDetailComponent {
  session = input.required<Session>();
  activityData = input<ActivityData | undefined>(undefined);

  needsFeedback(): boolean {
    const s = this.session();
    return (
      s.status === SessionStatus.COMPLETED &&
      !s.athletePerception &&
      s.type !== 'REST'
    );
  }

  getRpeClass(rpe: number): string {
    if (rpe <= 3) return 'bg-green-100 text-green-800';
    if (rpe <= 6) return 'bg-yellow-100 text-yellow-800';
    if (rpe <= 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatPace(secondsPerKm: number): string {
    const m = Math.floor(secondsPerKm / 60);
    const s = Math.floor(secondsPerKm % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getComparisonClass(actual: number | undefined, planned: number | undefined): string {
    if (!actual || !planned || planned === 0) return 'text-primary-700';
    const diff = Math.abs(actual - planned) / planned;
    if (diff <= 0.10) return 'text-green-700';
    if (diff <= 0.25) return 'text-amber-600';
    return 'text-red-600';
  }

  zonePercent(ad: ActivityData, zone: 'z1' | 'z2' | 'z3' | 'z4' | 'z5'): number {
    if (!ad.hrZonesDistribution) return 0;
    const dist = ad.hrZonesDistribution;
    const total = dist.z1 + dist.z2 + dist.z3 + dist.z4 + dist.z5;
    if (total === 0) return 0;
    return (dist[zone] / total) * 100;
  }
}
