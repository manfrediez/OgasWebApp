import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsersService, AthleteSummary } from '../../../services/users.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-primary-700">Mis Atletas</h1>
        <a
          routerLink="/coach/invite"
          class="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600">
          + Invitar Atleta
        </a>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (athletes().length === 0) {
        <app-empty-state
          icon="🏃"
          message="No tenés atletas aún"
          submessage="Invitá a tu primer atleta para comenzar" />
      } @else {
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50">
            <p class="text-xs font-medium text-primary-400 uppercase tracking-wide">Total Atletas</p>
            <p class="text-2xl font-bold text-primary-700 mt-1">{{ totalAthletes() }}</p>
          </div>
          <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50">
            <p class="text-xs font-medium text-primary-400 uppercase tracking-wide">Planes Activos</p>
            <p class="text-2xl font-bold text-primary-700 mt-1">{{ activePlans() }}</p>
          </div>
          <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50">
            <p class="text-xs font-medium text-primary-400 uppercase tracking-wide">Próximas Carreras</p>
            <p class="text-2xl font-bold text-primary-700 mt-1">{{ upcomingRaces() }}</p>
          </div>
          <div class="bg-surface rounded-xl p-4 shadow-sm border border-primary-50">
            <p class="text-xs font-medium text-primary-400 uppercase tracking-wide">Mensajes Sin Leer</p>
            <p class="text-2xl font-bold mt-1" [class]="totalUnread() > 0 ? 'text-accent-500' : 'text-primary-700'">
              {{ totalUnread() }}
            </p>
          </div>
        </div>

        <!-- Athlete Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (athlete of athletes(); track athlete._id) {
            <a
              [routerLink]="['/coach/athlete', athlete._id]"
              class="bg-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-primary-50">
              <!-- Header: Avatar + Name + Unread Badge -->
              <div class="flex items-center gap-3 mb-3">
                <div class="relative shrink-0">
                  <div class="h-10 w-10 rounded-full bg-accent-400 flex items-center justify-center text-white font-bold">
                    {{ athlete.firstName[0] }}{{ athlete.lastName[0] }}
                  </div>
                  @if (athlete.unreadMessages > 0) {
                    <span class="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-accent-500 text-[10px] font-bold text-white">
                      {{ athlete.unreadMessages }}
                    </span>
                  }
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-primary-700 truncate">{{ athlete.firstName }} {{ athlete.lastName }}</h3>
                  <p class="text-sm text-primary-400 truncate">{{ athlete.email }}</p>
                </div>
              </div>

              <!-- Current Plan + Progress -->
              @if (athlete.currentPlan) {
                <div class="mb-2 bg-surface-alt rounded-lg px-3 py-2">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-xs font-medium text-primary-500 truncate">{{ athlete.currentPlan.name }}</p>
                    <span class="text-xs font-semibold ml-2 shrink-0" [class]="getCompletionColor(athlete.completionPct)">
                      {{ athlete.completionPct }}%
                    </span>
                  </div>
                  <div class="h-1.5 bg-primary-50 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      [class]="getCompletionBarColor(athlete.completionPct)"
                      [style.width.%]="athlete.completionPct">
                    </div>
                  </div>
                </div>
              } @else {
                <div class="mb-2 bg-surface-alt rounded-lg px-3 py-2">
                  <p class="text-xs text-primary-300 italic">Sin plan activo</p>
                </div>
              }

              <!-- Bottom Row: Next Race + Status -->
              <div class="flex items-center justify-between">
                @if (athlete.nextRace) {
                  <div class="text-xs text-primary-400 truncate">
                    🏁 <span class="font-medium text-accent-600">{{ athlete.nextRace.name }}</span>
                    · {{ athlete.nextRace.date | dateEs:'dd MMM' }}
                  </div>
                } @else {
                  <span class="text-xs text-primary-300 italic">Sin carreras</span>
                }
                <div class="shrink-0 ml-2">
                  @if (athlete.isActive) {
                    <span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Activo
                    </span>
                  } @else {
                    <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Pendiente
                    </span>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private usersService = inject(UsersService);

  athletes = signal<AthleteSummary[]>([]);
  loading = signal(true);

  totalAthletes = computed(() => this.athletes().length);
  activePlans = computed(() => this.athletes().filter(a => a.currentPlan).length);
  upcomingRaces = computed(() => this.athletes().filter(a => a.nextRace).length);
  totalUnread = computed(() => this.athletes().reduce((sum, a) => sum + a.unreadMessages, 0));

  ngOnInit() {
    this.usersService.getAthletesSummary().subscribe({
      next: athletes => {
        this.athletes.set(athletes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getCompletionColor(pct: number): string {
    if (pct >= 75) return 'text-green-800';
    if (pct >= 50) return 'text-amber-700';
    return 'text-primary-400';
  }

  getCompletionBarColor(pct: number): string {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-400';
    return 'bg-primary-300';
  }
}
