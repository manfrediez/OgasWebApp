import { Pipe, PipeTransform } from '@angular/core';
import { HRZone } from '../../core/models/enums';

const LABELS: Record<HRZone, string> = {
  [HRZone.Z1]: 'Zona 1 - Recuperación',
  [HRZone.Z2]: 'Zona 2 - Base aeróbica',
  [HRZone.Z3]: 'Zona 3 - Tempo',
  [HRZone.Z4]: 'Zona 4 - Umbral',
  [HRZone.Z5]: 'Zona 5 - VO2max',
};

@Pipe({ name: 'hrZoneLabel', standalone: true })
export class HrZoneLabelPipe implements PipeTransform {
  transform(value: HRZone): string {
    return LABELS[value] ?? value;
  }
}
