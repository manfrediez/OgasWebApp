import { Component, input, computed } from '@angular/core';
import { WorkoutType } from '../../../core/models/enums';

@Component({
  selector: 'app-workout-type-icon',
  standalone: true,
  template: `
    <span [title]="label()" class="text-lg">{{ icon() }}</span>
  `,
})
export class WorkoutTypeIconComponent {
  type = input.required<WorkoutType>();

  icon = computed(() => {
    switch (this.type()) {
      case WorkoutType.BIKE: return '🚴';
      case WorkoutType.INTERVAL: return '⚡';
      case WorkoutType.CONTINUOUS: return '🏃';
      case WorkoutType.ELEVATION: return '⛰️';
      case WorkoutType.STRENGTH: return '💪';
      case WorkoutType.ACTIVATION: return '🔥';
      case WorkoutType.COMPETITION: return '🏆';
      case WorkoutType.REST: return '😴';
      case WorkoutType.QUALITY: return '🎯';
      default: return '📋';
    }
  });

  label = computed(() => {
    switch (this.type()) {
      case WorkoutType.BIKE: return 'Bicicleta';
      case WorkoutType.INTERVAL: return 'Intervalos';
      case WorkoutType.CONTINUOUS: return 'Continuo';
      case WorkoutType.ELEVATION: return 'Desnivel';
      case WorkoutType.STRENGTH: return 'Fuerza';
      case WorkoutType.ACTIVATION: return 'Activación';
      case WorkoutType.COMPETITION: return 'Competencia';
      case WorkoutType.REST: return 'Descanso';
      case WorkoutType.QUALITY: return 'Calidad';
      default: return 'Otro';
    }
  });
}
