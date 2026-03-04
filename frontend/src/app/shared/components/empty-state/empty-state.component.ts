import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card-glass-static rounded-2xl p-8 flex flex-col items-center justify-center py-12 text-primary-400">
      <span class="text-4xl mb-3">{{ icon() }}</span>
      <p class="text-lg font-medium">{{ message() }}</p>
      @if (submessage()) {
        <p class="text-sm mt-1">{{ submessage() }}</p>
      }
      @if (actionLabel()) {
        @if (actionLink()) {
          <a [routerLink]="actionLink()" class="btn-accent mt-4 inline-flex items-center gap-2 text-sm">
            {{ actionLabel() }}
          </a>
        } @else {
          <button (click)="actionClick.emit()" class="btn-accent mt-4 inline-flex items-center gap-2 text-sm">
            {{ actionLabel() }}
          </button>
        }
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input('📭');
  message = input('No hay datos');
  submessage = input('');
  actionLabel = input('');
  actionLink = input('');
  actionClick = output<void>();
}
