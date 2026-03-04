import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService, AthleteSummary } from '../../../services/users.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingSpinnerComponent, EmptyStateComponent, DateEsPipe],
  template: `
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="text-2xl font-semibold text-primary-800 tracking-tight">Mis Atletas</h1>
            <p class="text-primary-400 text-sm mt-1">Panel de seguimiento de tu equipo</p>
          </div>
          <a
            routerLink="/coach/invite"
            class="btn-primary flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"/>
            </svg>
            Invitar Atleta
          </a>
        </div>
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
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card-glass rounded-2xl p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-10 w-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                </svg>
              </div>
              <p class="text-xs font-semibold text-primary-500 uppercase tracking-wide">Total Atletas</p>
            </div>
            <p class="text-3xl font-bold text-primary-700">{{ totalAthletes() }}</p>
          </div>
          <div class="card-glass rounded-2xl p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-10 w-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
                </svg>
              </div>
              <p class="text-xs font-semibold text-accent-600 uppercase tracking-wide">Planes Activos</p>
            </div>
            <p class="text-3xl font-bold text-primary-700">{{ activePlans() }}</p>
          </div>
          <div class="card-glass rounded-2xl p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"/>
                </svg>
              </div>
              <p class="text-xs font-semibold text-green-600 uppercase tracking-wide">Próximas Carreras</p>
            </div>
            <p class="text-3xl font-bold text-primary-700">{{ upcomingRaces() }}</p>
          </div>
          <div class="card-glass rounded-2xl p-5">
            <div class="flex items-center gap-3 mb-2">
              <div class="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
                </svg>
              </div>
              <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide">Mensajes Sin Leer</p>
            </div>
            <p class="text-3xl font-bold" [class]="totalUnread() > 0 ? 'text-accent-500' : 'text-primary-700'">
              {{ totalUnread() }}
            </p>
          </div>
        </div>

        <!-- Section Header + Search -->
        <div class="flex items-center gap-3 mb-5">
          <h2 class="text-lg font-semibold text-primary-700">Equipo</h2>
          <div class="flex-1 h-px bg-primary-100"></div>
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-300" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              [(ngModel)]="searchTerm"
              placeholder="Buscar atleta..."
              class="pl-9 pr-3 py-2 rounded-lg border border-primary-200 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 w-48" />
          </div>
        </div>

        <!-- Athlete Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (athlete of filteredAthletes(); track athlete._id) {
            <a
              [routerLink]="['/coach/athlete', athlete._id]"
              class="group card-glass rounded-2xl p-5 hover:border-accent-300/50">
              <!-- Header: Avatar + Name + Unread Badge -->
              <div class="flex items-center gap-3 mb-3">
                <div class="relative shrink-0">
                  <div class="h-11 w-11 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold text-sm">
                    {{ athlete.firstName[0] }}{{ athlete.lastName[0] }}
                  </div>
                  @if (athlete.unreadMessages > 0) {
                    <span class="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-accent-500 ring-2 ring-surface text-[10px] font-bold text-white">
                      {{ athlete.unreadMessages }}
                    </span>
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-primary-700 truncate group-hover:text-accent-600 transition-colors">{{ athlete.firstName }} {{ athlete.lastName }}</h3>
                  <p class="text-sm text-primary-400 truncate">{{ athlete.email }}</p>
                </div>
                <svg class="w-5 h-5 text-primary-300 group-hover:text-accent-500 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </div>

              <!-- Current Plan + Progress -->
              @if (athlete.currentPlan) {
                <div class="mb-3 bg-primary-50 rounded-xl px-3 py-2.5">
                  <div class="flex items-center justify-between mb-1.5">
                    <p class="text-xs font-medium text-primary-500 truncate">{{ athlete.currentPlan.name }}</p>
                    <span class="text-xs font-semibold ml-2 shrink-0" [class]="getCompletionColor(athlete.completionPct)">
                      {{ athlete.completionPct }}%
                    </span>
                  </div>
                  <div class="h-2 bg-primary-50 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all"
                      [class]="getCompletionBarColor(athlete.completionPct)"
                      [style.width.%]="athlete.completionPct">
                    </div>
                  </div>
                </div>
              } @else {
                <div class="mb-3 bg-primary-50 rounded-xl px-3 py-2.5">
                  <p class="text-xs text-primary-300 italic">Sin plan activo</p>
                </div>
              }

              <!-- Bottom Row: Next Race + Status -->
              <div class="flex items-center justify-between pt-3 border-t border-primary-50">
                @if (athlete.nextRace) {
                  <div class="text-xs text-primary-400 truncate flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"/>
                    </svg>
                    <span class="font-medium text-accent-600">{{ athlete.nextRace.name }}</span>
                    <span>· {{ athlete.nextRace.date | dateEs:'dd MMM' }}</span>
                  </div>
                } @else {
                  <span class="text-xs text-primary-300 italic">Sin carreras</span>
                }
                <div class="shrink-0 ml-2">
                  @if (athlete.isActive) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      Activo
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
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
  private destroyRef = inject(DestroyRef);

  athletes = signal<AthleteSummary[]>([]);
  loading = signal(true);
  searchTerm = signal('');

  filteredAthletes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.athletes();
    return this.athletes().filter(a =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(term)
    );
  });

  totalAthletes = computed(() => this.athletes().length);
  activePlans = computed(() => this.athletes().filter(a => a.currentPlan).length);
  upcomingRaces = computed(() => this.athletes().filter(a => a.nextRace).length);
  totalUnread = computed(() => this.athletes().reduce((sum, a) => sum + a.unreadMessages, 0));

  ngOnInit() {
    this.usersService.getAthletesSummary().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
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
