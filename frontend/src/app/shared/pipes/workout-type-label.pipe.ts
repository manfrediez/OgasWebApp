import { Pipe, PipeTransform } from '@angular/core';
import { WorkoutType } from '../../core/models/enums';

const LABELS: Record<WorkoutType, string> = {
  [WorkoutType.BIKE]: 'Bicicleta',
  [WorkoutType.INTERVAL]: 'Intervalos',
  [WorkoutType.CONTINUOUS]: 'Continuo',
  [WorkoutType.ELEVATION]: 'Desnivel',
  [WorkoutType.STRENGTH]: 'Fuerza',
  [WorkoutType.ACTIVATION]: 'Activación',
  [WorkoutType.COMPETITION]: 'Competencia',
  [WorkoutType.REST]: 'Descanso',
  [WorkoutType.QUALITY]: 'Calidad',
};

@Pipe({ name: 'workoutTypeLabel', standalone: true })
export class WorkoutTypeLabelPipe implements PipeTransform {
  transform(value: WorkoutType): string {
    return LABELS[value] ?? value;
  }
}
