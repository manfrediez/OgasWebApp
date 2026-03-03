import { Pipe, PipeTransform } from '@angular/core';
import { SessionStatus } from '../../core/models/enums';

const LABELS: Record<SessionStatus, string> = {
  [SessionStatus.PLANNED]: 'Planificada',
  [SessionStatus.COMPLETED]: 'Completada',
  [SessionStatus.SKIPPED]: 'Omitida',
};

@Pipe({ name: 'sessionStatusLabel', standalone: true })
export class SessionStatusLabelPipe implements PipeTransform {
  transform(value: SessionStatus): string {
    return LABELS[value] ?? value;
  }
}
