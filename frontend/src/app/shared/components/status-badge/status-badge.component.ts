import { Component, input, computed } from '@angular/core';
import { SessionStatus } from '../../../core/models/enums';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="badgeClass()">
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<SessionStatus>();

  label = computed(() => {
    switch (this.status()) {
      case SessionStatus.PLANNED: return 'Planificada';
      case SessionStatus.COMPLETED: return 'Completada';
      case SessionStatus.SKIPPED: return 'Omitida';
      default: return this.status();
    }
  });

  badgeClass = computed(() => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm';
    switch (this.status()) {
      case SessionStatus.PLANNED:
        return `${base} bg-primary-100/60 text-primary-700`;
      case SessionStatus.COMPLETED:
        return `${base} bg-green-100/60 text-green-800`;
      case SessionStatus.SKIPPED:
        return `${base} bg-amber-100/60 text-amber-800`;
      default:
        return `${base} bg-gray-100/60 text-gray-800`;
    }
  });
}
