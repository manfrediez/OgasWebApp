import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService, AthleteGridItem } from '../../../services/users.service';

@Component({
  selector: 'app-athletes-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-primary-800">Atletas</h1>
        <div class="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o apellido..."
            [ngModel]="search()"
            (ngModelChange)="onSearchChange($event)"
            class="pl-10 pr-4 py-2.5 border border-primary-300 rounded-lg w-96 text-base focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">🔍</span>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
        </div>
      } @else {
        <div class="bg-surface rounded-xl shadow-sm border border-primary-100 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-primary-50 border-b border-primary-200">
                  <th class="text-left px-6 py-3 text-xs font-semibold text-primary-500 uppercase tracking-wider">Atleta</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-primary-500 uppercase tracking-wider">Días inactivo</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-primary-500 uppercase tracking-wider">Días activos (30d)</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-primary-500 uppercase tracking-wider">Próx. competencia</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-primary-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-primary-100">
                @for (athlete of athletes(); track athlete._id) {
                  <tr class="hover:bg-primary-50 transition-colors cursor-pointer" (click)="goToAthlete(athlete._id)">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-medium">
                          {{ athlete.firstName[0] }}{{ athlete.lastName[0] }}
                        </div>
                        <div>
                          <div class="font-medium text-primary-700">{{ athlete.lastName }}, {{ athlete.firstName }}</div>
                          <div class="text-sm text-primary-500">{{ athlete.email }}</div>
                        </div>
                        @if (athlete.isActive) {
                          <span class="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Activo</span>
                        } @else {
                          <span class="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Pendiente</span>
                        }
                      </div>
                    </td>
                    <td class="px-4 py-4 text-center">
                      @if (athlete.daysSinceLastActivity === null) {
                        <span class="text-primary-400">—</span>
                      } @else {
                        <span
                          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
                          [class]="getInactivityClass(athlete.daysSinceLastActivity)"
                        >
                          {{ athlete.daysSinceLastActivity }}
                        </span>
                      }
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center justify-center gap-2">
                        <span class="text-sm font-medium text-primary-600 w-6 text-right">{{ athlete.activeDaysLast30 }}</span>
                        <div class="w-20 bg-primary-200 rounded-full h-2">
                          <div
                            class="bg-accent-500 h-2 rounded-full transition-all"
                            [style.width.%]="(athlete.activeDaysLast30 / 30) * 100"
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      @if (athlete.nextRace) {
                        <div>
                          <div class="text-sm font-medium text-primary-700">{{ athlete.nextRace.name }}</div>
                          <div class="text-xs text-primary-500">
                            {{ athlete.nextRace.distance }} · en {{ getDaysUntil(athlete.nextRace.date) }} días
                          </div>
                        </div>
                      } @else {
                        <span class="text-primary-400">—</span>
                      }
                    </td>
                    <td class="px-4 py-4 text-center">
                      <a
                        [routerLink]="['/coach/athlete', athlete._id]"
                        class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Ver detalle
                      </a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-primary-500">
                      @if (search()) {
                        No se encontraron atletas para "{{ search() }}"
                      } @else {
                        No tenés atletas registrados
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-6 py-3 border-t border-primary-200 bg-primary-50">
              <span class="text-sm text-primary-500">
                {{ total() }} atletas en total
              </span>
              <div class="flex items-center gap-3">
                <button
                  (click)="goToPage(page() - 1)"
                  [disabled]="page() <= 1"
                  class="px-3 py-1.5 text-sm font-medium rounded-lg border border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-100 transition-colors"
                >
                  Anterior
                </button>
                <span class="text-sm text-primary-500">
                  Página {{ page() }} de {{ totalPages() }}
                </span>
                <button
                  (click)="goToPage(page() + 1)"
                  [disabled]="page() >= totalPages()"
                  class="px-3 py-1.5 text-sm font-medium rounded-lg border border-primary-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-100 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AthletesListComponent implements OnInit {
  private usersService = inject(UsersService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private searchTimeout: any;

  athletes = signal<AthleteGridItem[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  search = signal('');

  private readonly LIMIT = 20;

  ngOnInit() {
    this.loadAthletes();
  }

  onSearchChange(value: string) {
    this.search.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadAthletes();
    }, 300);
  }

  goToAthlete(id: string) {
    this.router.navigate(['/coach/athlete', id]);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadAthletes();
  }

  getInactivityClass(days: number): string {
    if (days < 3) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (days < 10) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  }

  getDaysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  private loadAthletes() {
    this.loading.set(true);
    const searchVal = this.search().trim() || undefined;
    this.usersService.getAthletesGrid(this.page(), this.LIMIT, searchVal).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.athletes.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(Math.ceil(res.total / res.limit) || 1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
