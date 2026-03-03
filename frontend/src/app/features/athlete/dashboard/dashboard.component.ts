import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { format, parseISO, differenceInCalendarDays, isAfter, startOfDay } from 'date-fns';

import { AuthService } from '../../../core/services/auth.service';
import { WorkoutPlansService } from '../../../services/workout-plans.service';
import { GoalRacesService } from '../../../services/goal-races.service';
import { AthleteMetricsService } from '../../../services/athlete-metrics.service';
import { MessagesService } from '../../../services/messages.service';

import { WorkoutPlan, Session } from '../../../models/workout-plan.model';
import { GoalRace } from '../../../models/goal-race.model';
import { AthleteMetrics } from '../../../models/athlete-metrics.model';
import { SessionStatus } from '../../../core/models/enums';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { WorkoutTypeIconComponent } from '../../../shared/components/workout-type-icon/workout-type-icon.component';
import { WorkoutTypeLabelPipe } from '../../../shared/pipes/workout-type-label.pipe';
import { DateEsPipe } from '../../../shared/pipes/date-es.pipe';

interface UpcomingRace {
  name: string;
  distance: string;
  date: string;
  daysUntil: number;
}

interface MonthSummary {
  completed: number;
  planned: number;
  skipped: number;
  total: number;
  percent: number;
  totalDistance: number;
  totalDuration: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    LoadingSpinnerComponent,
    WorkoutTypeIconComponent,
    WorkoutTypeLabelPipe,
    DateEsPipe,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="space-y-6">
        <!-- Saludo -->
        <h1 class="text-xl md:text-2xl font-bold text-primary-700">{{ greeting() }}, {{ firstName() }}</h1>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Entrenamiento de Hoy -->
          <div class="bg-surface rounded-xl shadow-sm border border-primary-100 p-4 md:p-5">
            <h2 class="text-lg font-semibold text-primary-700 mb-3">Entrenamiento de Hoy</h2>
            @if (todaySession(); as session) {
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <app-workout-type-icon [type]="session.type" />
                  <span class="font-medium text-primary-700">{{ session.type | workoutTypeLabel }}</span>
                </div>
                @if (session.description) {
                  <p class="text-sm text-primary-500">{{ session.description }}</p>
                }
                <div class="flex flex-wrap gap-4 text-sm text-primary-400">
                  @if (session.duration) {
                    <span>{{ session.duration }} min</span>
                  }
                  @if (session.distance) {
                    <span>{{ session.distance }} km</span>
                  }
                </div>
                @if (session.coachNotes) {
                  <div class="mt-2 p-3 bg-accent-500/10 rounded-lg text-sm text-primary-600">
                    <span class="font-medium">Nota del coach:</span> {{ session.coachNotes }}
                  </div>
                }
              </div>
            } @else {
              <div class="flex items-center gap-3 text-primary-400">
                <span class="text-3xl">😴</span>
                <span>Dia de descanso</span>
              </div>
            }
            <a routerLink="/athlete/plan" class="inline-block mt-4 text-sm text-accent-500 hover:text-accent-600 font-medium">
              Ver plan completo →
            </a>
          </div>

          <!-- Resumen del Mes -->
          <div class="bg-surface rounded-xl shadow-sm border border-primary-100 p-4 md:p-5">
            <h2 class="text-lg font-semibold text-primary-700 mb-3">Resumen del Mes</h2>

            <!-- Progress bar -->
            @if (monthSummary().total > 0) {
              <div class="mb-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-primary-600">
                    {{ monthSummary().completed }}/{{ monthSummary().total }} sesiones
                  </span>
                  <span class="text-sm font-bold text-green-600">{{ monthSummary().percent }}%</span>
                </div>
                <div class="w-full h-2.5 bg-primary-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full transition-all"
                       [style.width.%]="monthSummary().percent"></div>
                </div>
              </div>
            }

            <div class="grid grid-cols-3 gap-2 md:gap-3 mb-3">
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <p class="text-2xl font-bold text-green-600">{{ monthSummary().completed }}</p>
                <p class="text-xs text-green-500">Completadas</p>
              </div>
              <div class="text-center p-3 bg-primary-50 rounded-lg">
                <p class="text-2xl font-bold text-primary-500">{{ monthSummary().planned }}</p>
                <p class="text-xs text-primary-400">Pendientes</p>
              </div>
              <div class="text-center p-3 bg-amber-50 rounded-lg">
                <p class="text-2xl font-bold text-amber-500">{{ monthSummary().skipped }}</p>
                <p class="text-xs text-amber-400">Omitidas</p>
              </div>
            </div>
            <div class="flex gap-4 text-sm text-primary-400">
              @if (monthSummary().totalDistance > 0) {
                <span>{{ monthSummary().totalDistance | number:'1.0-1' }} km totales</span>
              }
              @if (monthSummary().totalDuration > 0) {
                <span>{{ monthSummary().totalDuration }} min totales</span>
              }
            </div>
          </div>

          <!-- Proximas Carreras -->
          @if (upcomingRaces().length > 0) {
            <div class="bg-surface rounded-xl shadow-sm border border-primary-100 p-4 md:p-5">
              <h2 class="text-lg font-semibold text-primary-700 mb-3">Proximas Carreras</h2>
              <div class="space-y-3">
                @for (race of upcomingRaces(); track race.name) {
                  <div class="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <div>
                      <p class="font-medium text-primary-700">{{ race.name }}</p>
                      <p class="text-sm text-primary-400">{{ race.distance }} · {{ race.date | dateEs:'d MMM yyyy' }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-2xl font-bold text-accent-500">{{ race.daysUntil }}</p>
                      <p class="text-xs text-primary-400">dias</p>
                    </div>
                  </div>
                }
              </div>
              <a routerLink="/athlete/races" class="inline-block mt-4 text-sm text-accent-500 hover:text-accent-600 font-medium">
                Ver todas →
              </a>
            </div>
          }

          <!-- Mensajes sin leer -->
          @if (messagesService.unreadCount() > 0) {
            <a routerLink="/athlete/messages"
               class="bg-surface rounded-xl shadow-sm border border-accent-200 p-4 md:p-5 flex items-center gap-4 hover:border-accent-400 transition-colors">
              <span class="text-3xl">💬</span>
              <div>
                <p class="font-semibold text-primary-700">
                  {{ messagesService.unreadCount() }} {{ messagesService.unreadCount() === 1 ? 'mensaje sin leer' : 'mensajes sin leer' }}
                </p>
                <p class="text-sm text-primary-400">Tocá para ver la conversacion</p>
              </div>
            </a>
          }

          <!-- Mis Objetivos -->
          @if (metrics()?.objectivesShortTerm || metrics()?.objectivesMediumTerm) {
            <div class="bg-surface rounded-xl shadow-sm border border-primary-100 p-4 md:p-5">
              <h2 class="text-lg font-semibold text-primary-700 mb-3">Mis Objetivos</h2>
              @if (metrics()?.objectivesShortTerm) {
                <div class="mb-3">
                  <p class="text-xs font-medium text-primary-400 uppercase mb-1">Corto plazo</p>
                  <p class="text-sm text-primary-600">{{ metrics()!.objectivesShortTerm }}</p>
                </div>
              }
              @if (metrics()?.objectivesMediumTerm) {
                <div>
                  <p class="text-xs font-medium text-primary-400 uppercase mb-1">Mediano plazo</p>
                  <p class="text-sm text-primary-600">{{ metrics()!.objectivesMediumTerm }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private plansService = inject(WorkoutPlansService);
  private racesService = inject(GoalRacesService);
  private metricsService = inject(AthleteMetricsService);
  messagesService = inject(MessagesService);

  loading = signal(true);
  firstName = signal('');
  todaySession = signal<Session | null>(null);
  monthSummary = signal<MonthSummary>({ completed: 0, planned: 0, skipped: 0, total: 0, percent: 0, totalDistance: 0, totalDuration: 0 });
  upcomingRaces = signal<UpcomingRace[]>([]);
  metrics = signal<AthleteMetrics | null>(null);

  greeting = signal('');

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.firstName.set(user.firstName);
    this.greeting.set(this.getGreeting());

    forkJoin({
      plans: this.plansService.getByAthlete(user._id),
      races: this.racesService.getByAthlete(user._id),
      metrics: this.metricsService.getByAthlete(user._id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ plans, races, metrics }) => {
        this.processTodaySession(plans);
        this.processMonthSummary(plans);
        this.processUpcomingRaces(races);
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  private processTodaySession(plans: WorkoutPlan[]) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    for (const plan of plans) {
      for (const week of plan.weeks) {
        const session = week.sessions.find(s => s.date?.substring(0, 10) === todayStr);
        if (session) {
          this.todaySession.set(session);
          return;
        }
      }
    }
  }

  private processMonthSummary(plans: WorkoutPlan[]) {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let completed = 0, planned = 0, skipped = 0, totalDistance = 0, totalDuration = 0;

    for (const plan of plans) {
      for (const week of plan.weeks) {
        for (const session of week.sessions) {
          if (!session.date) continue;
          const sessionDate = parseISO(session.date);
          if (sessionDate >= thirtyDaysAgo && sessionDate <= today) {
            if (session.status === SessionStatus.COMPLETED) {
              completed++;
              totalDistance += session.distance || 0;
              totalDuration += session.duration || 0;
            } else if (session.status === SessionStatus.SKIPPED) {
              skipped++;
            } else {
              planned++;
            }
          }
        }
      }
    }

    const total = completed + planned + skipped;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.monthSummary.set({ completed, planned, skipped, total, percent, totalDistance, totalDuration });
  }

  private processUpcomingRaces(races: GoalRace[]) {
    const today = startOfDay(new Date());
    const upcoming = races
      .filter(r => isAfter(parseISO(r.date), today) || format(parseISO(r.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
      .map(r => ({
        name: r.name,
        distance: r.distance,
        date: r.date,
        daysUntil: differenceInCalendarDays(parseISO(r.date), today),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    this.upcomingRaces.set(upcoming);
  }
}
