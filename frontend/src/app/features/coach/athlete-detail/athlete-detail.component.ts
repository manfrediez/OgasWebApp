import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { UsersService } from '../../../services/users.service';
import { User } from '../../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PlansTabComponent } from './tabs/plans-tab/plans-tab.component';
import { MetricsTabComponent } from './tabs/metrics-tab/metrics-tab.component';
import { GoalRacesTabComponent } from './tabs/goal-races-tab/goal-races-tab.component';
import { RaceStrategiesTabComponent } from './tabs/race-strategies-tab/race-strategies-tab.component';
import { StrengthTabComponent } from './tabs/strength-tab/strength-tab.component';
import { SummaryTabComponent } from './tabs/summary-tab/summary-tab.component';
import { ImportExcelDialogComponent } from '../forms/import-excel-dialog/import-excel-dialog.component';

@Component({
  selector: 'app-athlete-detail',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    PlansTabComponent,
    MetricsTabComponent,
    GoalRacesTabComponent,
    RaceStrategiesTabComponent,
    StrengthTabComponent,
    SummaryTabComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (athlete()) {
      <div>
        <div class="flex items-center gap-4 mb-6">
          <button (click)="goBack()" class="text-primary-400 hover:text-primary-700">
            ← Volver
          </button>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-primary-700 flex items-center gap-2">
              {{ athlete()!.firstName }} {{ athlete()!.lastName }}
              @if (athlete()!.strava?.athleteId) {
                <a
                  [href]="'https://www.strava.com/athletes/' + athlete()!.strava!.athleteId"
                  target="_blank"
                  rel="noopener"
                  title="Ver perfil en Strava"
                  class="inline-flex items-center text-[#FC4C02] hover:opacity-80">
                  <svg aria-hidden="true" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                  </svg>
                </a>
              }
            </h1>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-primary-400">
              <span>{{ athlete()!.email }}</span>
              @if (athlete()!.phone) {
                <span>{{ athlete()!.phone }}</span>
              }
              @if (athlete()!.address) {
                <span>{{ athlete()!.address }}</span>
              }
              @if (athleteAge() !== null) {
                <span>{{ athleteAge() }} años</span>
              }
            </div>
          </div>
          <button
            (click)="openImportDialog()"
            class="rounded-lg border border-accent-500 text-accent-500 px-4 py-2 text-sm font-medium hover:bg-accent-500 hover:text-white transition-colors">
            Importar Excel
          </button>
        </div>

        <!-- Tabs -->
        <div class="border-b border-primary-100 mb-6">
          <nav class="flex gap-1 -mb-px overflow-x-auto">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="activeTab.set(tab.id)"
                [class]="activeTab() === tab.id
                  ? 'border-b-2 border-accent-500 text-accent-500 px-4 py-2 text-sm font-medium whitespace-nowrap'
                  : 'border-b-2 border-transparent text-primary-400 hover:text-primary-600 px-4 py-2 text-sm font-medium whitespace-nowrap'">
                {{ tab.label }}
              </button>
            }
          </nav>
        </div>

        <!-- Tab content -->
        @switch (activeTab()) {
          @case ('plans') {
            <app-plans-tab [athleteId]="athleteId" />
          }
          @case ('summary') {
            <app-summary-tab [athleteId]="athleteId" />
          }
          @case ('metrics') {
            <app-metrics-tab [athleteId]="athleteId" />
          }
          @case ('goal-races') {
            <app-goal-races-tab [athleteId]="athleteId" />
          }
          @case ('race-strategies') {
            <app-race-strategies-tab [athleteId]="athleteId" />
          }
          @case ('strength') {
            <app-strength-tab [athleteId]="athleteId" />
          }
        }
      </div>
    }
  `,
})
export class AthleteDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(Dialog);
  private usersService = inject(UsersService);
  private destroyRef = inject(DestroyRef);

  athleteId = '';
  athlete = signal<User | null>(null);
  loading = signal(true);
  activeTab = signal('plans');
  athleteAge = computed(() => {
    const a = this.athlete();
    if (!a?.birthDate) return null;
    const today = new Date();
    const birth = new Date(a.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  });

  tabs = [
    { id: 'plans', label: 'Planes' },
    { id: 'summary', label: 'Resumen' },
    { id: 'metrics', label: 'Métricas' },
    { id: 'goal-races', label: 'Carreras' },
    { id: 'race-strategies', label: 'Estrategias' },
    { id: 'strength', label: 'Fuerza' },
  ];

  ngOnInit() {
    this.athleteId = this.route.snapshot.paramMap.get('athleteId')!;
    this.usersService.getById(this.athleteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.athlete.set(user);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack() {
    this.router.navigate(['/coach/dashboard']);
  }

  openImportDialog() {
    const ref = this.dialog.open<boolean>(ImportExcelDialogComponent, {
      data: { athleteId: this.athleteId },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });
    ref.closed.subscribe((result) => {
      if (result) {
        // Reload current tab data by toggling the tab
        const current = this.activeTab();
        this.activeTab.set('');
        setTimeout(() => this.activeTab.set(current), 0);
      }
    });
  }
}
