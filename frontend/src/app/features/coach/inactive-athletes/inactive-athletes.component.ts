import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsersService, InactiveAthlete } from '../../../services/users.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-inactive-athletes',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-primary-700 mb-6">Atletas Inactivos</h1>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (athletes().length === 0) {
        <app-empty-state
          icon="✅"
          message="Todos tus atletas están activos"
          submessage="No hay atletas con inactividad prolongada" />
      } @else {
        <div class="flex flex-col gap-3">
          @for (athlete of athletes(); track athlete._id) {
            <a
              [routerLink]="['/coach/athlete', athlete._id]"
              class="flex items-center gap-4 bg-surface rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-primary-50">
              <!-- Avatar with severity color -->
              <div
                class="h-11 w-11 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                [class]="getAvatarColor(athlete.daysSinceLastActivity)">
                {{ athlete.firstName[0] }}{{ athlete.lastName[0] }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <h3 class="font-semibold text-primary-700 truncate">{{ athlete.firstName }} {{ athlete.lastName }}</h3>
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0"
                    [class]="getBadgeColor(athlete.daysSinceLastActivity)">
                    @if (athlete.daysSinceLastActivity === null) {
                      Sin actividad
                    } @else {
                      {{ athlete.daysSinceLastActivity }}d inactivo
                    }
                  </span>
                </div>
                <p class="text-sm text-primary-400 truncate">{{ athlete.email }}</p>
                <div class="flex items-center gap-3 mt-1 text-xs text-primary-400">
                  @if (athlete.lastActivityDate) {
                    <span>Última sesión: {{ athlete.lastActivityDate | dateEs }}</span>
                    @if (athlete.lastSessionType) {
                      <span class="text-primary-300">·</span>
                      <span>{{ athlete.lastSessionType }}</span>
                    }
                  }
                  @if (athlete.currentPlanName) {
                    <span class="text-primary-300">·</span>
                    <span class="truncate">Plan: {{ athlete.currentPlanName }}</span>
                  }
                </div>
              </div>

              <!-- Arrow -->
              <span class="text-primary-300 shrink-0">→</span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class InactiveAthletesComponent implements OnInit {
  private usersService = inject(UsersService);

  athletes = signal<InactiveAthlete[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.usersService.getInactiveAthletes().subscribe({
      next: athletes => {
        this.athletes.set(athletes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getAvatarColor(days: number | null): string {
    if (days === null || days >= 10) return 'bg-red-500';
    if (days >= 3) return 'bg-amber-500';
    return 'bg-accent-400';
  }

  getBadgeColor(days: number | null): string {
    if (days === null || days >= 10) return 'bg-red-100 text-red-800';
    if (days >= 3) return 'bg-amber-100 text-amber-800';
    return 'bg-cyan-100 text-cyan-800';
  }
}
