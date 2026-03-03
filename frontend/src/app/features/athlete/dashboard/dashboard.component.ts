import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
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
import { ToastService } from '../../../shared/services/toast.service';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { WorkoutTypeIconComponent } from '../../../shared/components/workout-type-icon/workout-type-icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SessionFeedbackDialogComponent } from '../my-plan/session-feedback-dialog/session-feedback-dialog.component';
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
    StatusBadgeComponent,
    WorkoutTypeLabelPipe,
    DateEsPipe,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Greeting -->
        <div class="rounded-2xl bg-primary-50 border border-primary-200 px-6 py-6">
          <p class="text-primary-400 text-sm font-medium">{{ greeting() }}</p>
          <h1 class="text-2xl font-semibold text-primary-800 mt-1">{{ firstName() }}</h1>
          <p class="text-primary-400 text-sm mt-1">Preparate para dar lo mejor hoy</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Entrenamiento de Hoy -->
          <div class="card-glass-static rounded-2xl p-5 md:p-6 border-l-4 border-l-accent-500">
            <h2 class="text-lg font-semibold text-primary-700 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"/>
              </svg>
              Entrenamiento de Hoy
            </h2>
            @if (todaySession(); as session) {
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <app-workout-type-icon [type]="session.type" />
                  <span class="font-semibold text-primary-700">{{ session.type | workoutTypeLabel }}</span>
                </div>
                @if (session.description) {
                  <p class="text-sm text-primary-500 leading-relaxed">{{ session.description }}</p>
                }
                <div class="flex flex-wrap gap-2">
                  @if (session.duration) {
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                      </svg>
                      {{ session.duration }} min
                    </span>
                  }
                  @if (session.distance) {
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
                      </svg>
                      {{ session.distance }} km
                    </span>
                  }
                </div>
                @if (session.coachNotes) {
                  <div class="mt-1 p-3 border border-accent-200 bg-accent-500/5 rounded-xl text-sm text-primary-600">
                    <p class="text-[10px] font-semibold text-accent-600 uppercase tracking-wider mb-1">Nota del coach</p>
                    {{ session.coachNotes }}
                  </div>
                }
                <!-- Feedback status + RPE + button -->
                <div class="flex items-center flex-wrap gap-2 mt-1 pt-3 border-t border-primary-100">
                  @if (session.status !== 'PLANNED') {
                    <app-status-badge [status]="session.status" />
                  }
                  @if (session.athletePerception) {
                    <span class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-sm font-medium text-primary-600">
                      RPE {{ session.athletePerception }}
                    </span>
                  }
                  <button (click)="openFeedback()" class="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-accent-500 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-600 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/>
                    </svg>
                    {{ session.athletePerception ? 'Editar feedback' : 'Registrar feedback' }}
                  </button>
                </div>
              </div>
            } @else {
              <div class="flex items-center gap-3 py-4">
                <div class="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-primary-600">Dia de descanso</p>
                  <p class="text-sm text-primary-400">Aprovechá para recuperarte</p>
                </div>
              </div>
            }
            <a routerLink="/athlete/plan" class="inline-flex items-center gap-1 mt-4 text-sm text-accent-500 hover:text-accent-600 font-medium group">
              Ver plan completo
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </a>
          </div>

          <!-- Resumen del Mes -->
          <div class="card-glass-static rounded-2xl p-5 md:p-6">
            <h2 class="text-lg font-semibold text-primary-700 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
              </svg>
              Resumen del Mes
            </h2>

            @if (monthSummary().total > 0) {
              <div class="mb-5">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-primary-600">
                    {{ monthSummary().completed }}/{{ monthSummary().total }} sesiones
                  </span>
                  <span class="text-sm font-bold text-green-600">{{ monthSummary().percent }}%</span>
                </div>
                <div class="w-full h-3 bg-primary-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full transition-all"
                       [style.width.%]="monthSummary().percent"></div>
                </div>
              </div>
            }

            <div class="grid grid-cols-3 gap-2 md:gap-3 mb-4">
              <div class="text-center p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p class="text-2xl font-bold text-green-600">{{ monthSummary().completed }}</p>
                <p class="text-xs font-medium text-green-500">Completadas</p>
              </div>
              <div class="text-center p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p class="text-2xl font-bold text-primary-500">{{ monthSummary().planned }}</p>
                <p class="text-xs font-medium text-primary-400">Pendientes</p>
              </div>
              <div class="text-center p-3 bg-primary-50 rounded-xl border border-primary-200">
                <p class="text-2xl font-bold text-amber-500">{{ monthSummary().skipped }}</p>
                <p class="text-xs font-medium text-amber-400">Omitidas</p>
              </div>
            </div>
            <div class="flex gap-4 text-sm text-primary-500 pt-3 border-t border-primary-100">
              @if (monthSummary().totalDistance > 0) {
                <span class="inline-flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
                  </svg>
                  {{ monthSummary().totalDistance | number:'1.0-1' }} km
                </span>
              }
              @if (monthSummary().totalDuration > 0) {
                <span class="inline-flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                  </svg>
                  {{ monthSummary().totalDuration }} min
                </span>
              }
            </div>
          </div>

          <!-- Proximas Carreras -->
          @if (upcomingRaces().length > 0) {
            <div class="card-glass-static rounded-2xl p-5 md:p-6">
              <h2 class="text-lg font-semibold text-primary-700 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"/>
                </svg>
                Proximas Carreras
              </h2>
              <div class="space-y-3">
                @for (race of upcomingRaces(); track race.name) {
                  <div class="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-200 hover:border-accent-300 transition-all">
                    <div>
                      <p class="font-semibold text-primary-700">{{ race.name }}</p>
                      <p class="text-sm text-primary-400 mt-0.5">
                        <span class="inline-flex items-center gap-1">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
                          </svg>
                          {{ race.distance }}
                        </span>
                         · {{ race.date | dateEs:'d MMM yyyy' }}
                      </p>
                    </div>
                    <div class="text-center bg-accent-500/10 rounded-xl px-4 py-2">
                      <p class="text-2xl font-bold text-accent-500">{{ race.daysUntil }}</p>
                      <p class="text-[10px] font-medium text-accent-600 uppercase">dias</p>
                    </div>
                  </div>
                }
              </div>
              <a routerLink="/athlete/races" class="inline-flex items-center gap-1 mt-4 text-sm text-accent-500 hover:text-accent-600 font-medium group">
                Ver todas
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                </svg>
              </a>
            </div>
          }

          <!-- Mensajes sin leer -->
          @if (messagesService.unreadCount() > 0) {
            <a routerLink="/athlete/messages"
               class="group rounded-2xl bg-accent-500 p-5 md:p-6 flex items-center gap-4 hover:bg-accent-600 transition-all border border-accent-600 shadow-sm">
              <div class="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-white">
                  {{ messagesService.unreadCount() }} {{ messagesService.unreadCount() === 1 ? 'mensaje sin leer' : 'mensajes sin leer' }}
                </p>
                <p class="text-sm text-white/70">Tocá para ver la conversacion</p>
              </div>
              <svg class="w-5 h-5 text-white/70 shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </a>
          }

          <!-- Mis Objetivos -->
          @if (metrics()?.objectivesShortTerm || metrics()?.objectivesMediumTerm) {
            <div class="card-glass-static rounded-2xl p-5 md:p-6">
              <h2 class="text-lg font-semibold text-primary-700 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/>
                </svg>
                Mis Objetivos
              </h2>
              <div class="space-y-3">
                @if (metrics()?.objectivesShortTerm) {
                  <div class="border-l-4 border-l-accent-500 bg-accent-500/5 rounded-r-xl p-4">
                    <p class="text-[10px] font-semibold text-accent-600 uppercase tracking-wider mb-1">Corto plazo</p>
                    <p class="text-sm text-primary-600 leading-relaxed">{{ metrics()!.objectivesShortTerm }}</p>
                  </div>
                }
                @if (metrics()?.objectivesMediumTerm) {
                  <div class="border-l-4 border-l-primary-500 bg-primary-50/50 rounded-r-xl p-4">
                    <p class="text-[10px] font-semibold text-primary-500 uppercase tracking-wider mb-1">Mediano plazo</p>
                    <p class="text-sm text-primary-600 leading-relaxed">{{ metrics()!.objectivesMediumTerm }}</p>
                  </div>
                }
              </div>
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
  private dialog = inject(Dialog);
  private toast = inject(ToastService);
  messagesService = inject(MessagesService);

  loading = signal(true);
  firstName = signal('');
  todaySession = signal<Session | null>(null);
  todaySessionMeta = signal<{ planId: string; weekNumber: number; sessionIndex: number } | null>(null);
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
      plans: this.plansService.getByAthlete(user._id).pipe(catchError(() => of([]))),
      races: this.racesService.getByAthlete(user._id).pipe(catchError(() => of([]))),
      metrics: this.metricsService.getByAthlete(user._id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ plans, races, metrics }) => {
        this.processTodaySession(plans);
        this.processMonthSummary(plans);
        this.processUpcomingRaces(races);
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar el dashboard');
        this.loading.set(false);
      },
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
      if (!plan.weeks) continue;
      for (const week of plan.weeks) {
        if (!week.sessions) continue;
        const sessionIndex = week.sessions.findIndex(s => s.date?.substring(0, 10) === todayStr);
        if (sessionIndex !== -1) {
          this.todaySession.set(week.sessions[sessionIndex]);
          this.todaySessionMeta.set({ planId: plan._id, weekNumber: week.weekNumber, sessionIndex });
          return;
        }
      }
    }
  }

  openFeedback() {
    const session = this.todaySession();
    const meta = this.todaySessionMeta();
    if (!session || !meta) return;

    const ref = this.dialog.open(SessionFeedbackDialogComponent, {
      data: { session },
      panelClass: ['flex', 'items-center', 'justify-center', 'p-4'],
    });

    ref.closed.subscribe((result) => {
      if (result) {
        this.plansService.updateSessionFeedback(
          meta.planId, meta.weekNumber, meta.sessionIndex, result
        ).subscribe({
          next: (updatedPlan) => {
            const week = updatedPlan.weeks.find(w => w.weekNumber === meta.weekNumber);
            if (week) {
              this.todaySession.set(week.sessions[meta.sessionIndex]);
            }
          },
        });
      }
    });
  }

  private processMonthSummary(plans: WorkoutPlan[]) {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let completed = 0, planned = 0, skipped = 0, totalDistance = 0, totalDuration = 0;

    for (const plan of plans) {
      if (!plan.weeks) continue;
      for (const week of plan.weeks) {
        if (!week.sessions) continue;
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
