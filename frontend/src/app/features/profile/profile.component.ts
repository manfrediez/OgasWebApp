import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../services/users.service';
import { WorkoutPlansService } from '../../services/workout-plans.service';
import { StravaService, StravaStatus } from '../../services/strava.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { PlanSummary } from '../../models/workout-plan.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-bg">
      <app-navbar />
      <div class="max-w-lg mx-auto p-6">
        <div class="flex items-center gap-4 mb-6">
          <button (click)="goBack()" class="text-primary-400 hover:text-primary-700">← Volver</button>
          <h1 class="text-2xl font-bold text-primary-700">Mi Perfil</h1>
        </div>

        <!-- Avatar Header -->
        <div class="card-glass rounded-xl p-6 mb-6 flex items-center gap-5">
          <div class="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {{ initials() }}
          </div>
          <div class="min-w-0">
            <p class="text-xl font-bold text-primary-700 truncate">{{ firstName }} {{ lastName }}</p>
            <p class="text-sm text-primary-400 truncate">{{ email }}</p>
            <span
              class="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              [class]="isAthlete ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'">
              {{ isAthlete ? 'ATLETA' : 'ENTRENADOR' }}
            </span>
          </div>
        </div>

        <!-- Stats Card (athletes only) -->
        @if (isAthlete) {
          <div class="card-glass rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold text-primary-700 mb-4 flex items-center gap-2">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumen de actividad
            </h2>
            @if (statsLoading()) {
              <p class="text-sm text-primary-400">Cargando estadísticas...</p>
            } @else {
              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="text-center bg-bg rounded-lg p-3">
                  <p class="text-2xl font-bold text-primary-700">{{ totalSessions() }}</p>
                  <p class="text-xs text-primary-400">sesiones</p>
                </div>
                <div class="text-center bg-bg rounded-lg p-3">
                  <p class="text-2xl font-bold text-primary-700">{{ totalKm() }}</p>
                  <p class="text-xs text-primary-400">km total</p>
                </div>
                <div class="text-center bg-bg rounded-lg p-3">
                  <p class="text-2xl font-bold text-primary-700">{{ avgCompletion() }}%</p>
                  <p class="text-xs text-primary-400">cumplimiento</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="text-center bg-bg rounded-lg p-3">
                  <p class="text-2xl font-bold text-primary-700">{{ totalMinutes() }}</p>
                  <p class="text-xs text-primary-400">minutos</p>
                </div>
                <div class="text-center bg-bg rounded-lg p-3">
                  <p class="text-2xl font-bold text-primary-700">{{ avgRpe() }}</p>
                  <p class="text-xs text-primary-400">RPE prom.</p>
                </div>
              </div>
            }
          </div>
        }

        <!-- Personal Data -->
        <div class="card-glass rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold text-primary-700 mb-4 flex items-center gap-2">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Datos personales
          </h2>
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Nombre</label>
              <input [(ngModel)]="firstName" #fnInput="ngModel" name="firstName" required class="w-full"
                     [class.border-danger-500]="fnInput.invalid && fnInput.touched"
                     [attr.aria-invalid]="fnInput.invalid && fnInput.touched"
                     [attr.aria-describedby]="(fnInput.invalid && fnInput.touched) ? 'fn-error' : null" />
              @if (fnInput.invalid && fnInput.touched) {
                <p id="fn-error" class="text-xs text-danger-500 mt-1">El nombre es obligatorio</p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Apellido</label>
              <input [(ngModel)]="lastName" #lnInput="ngModel" name="lastName" required class="w-full"
                     [class.border-danger-500]="lnInput.invalid && lnInput.touched"
                     [attr.aria-invalid]="lnInput.invalid && lnInput.touched"
                     [attr.aria-describedby]="(lnInput.invalid && lnInput.touched) ? 'ln-error' : null" />
              @if (lnInput.invalid && lnInput.touched) {
                <p id="ln-error" class="text-xs text-danger-500 mt-1">El apellido es obligatorio</p>
              }
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">
                Fecha de nacimiento
                @if (birthDate && calculatedAge() !== null) {
                  <span class="text-primary-400 font-normal">({{ calculatedAge() }} años)</span>
                }
              </label>
              <input [(ngModel)]="birthDate" name="birthDate" type="date" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Teléfono</label>
              <input [(ngModel)]="phone" name="phone" type="tel" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-600 mb-1">Dirección</label>
              <input [(ngModel)]="address" name="address" class="w-full" />
            </div>

            @if (success()) {
              <p class="text-sm text-success-500 bg-green-50 rounded-lg p-2">Perfil actualizado</p>
            }

            @if (error()) {
              <p class="text-sm text-danger-500 bg-red-50 rounded-lg p-2">{{ error() }}</p>
            }

            <button
              type="submit"
              [disabled]="saving()"
              class="w-full btn-primary py-2.5">
              @if (saving()) {
                Guardando...
              } @else {
                Guardar Cambios
              }
            </button>
          </form>
        </div>

        <!-- Change Password (collapsible) -->
        <div class="card-glass rounded-xl mb-6">
          <button
            type="button"
            (click)="passwordOpen.set(!passwordOpen())"
            [attr.aria-expanded]="passwordOpen()"
            class="w-full flex items-center justify-between p-6 text-left">
            <h2 class="text-lg font-semibold text-primary-700 flex items-center gap-2">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Cambiar contraseña
            </h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 text-primary-400 transition-transform duration-200"
              [class.rotate-180]="passwordOpen()"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          @if (passwordOpen()) {
            <div class="px-6 pb-6">
              <form (ngSubmit)="onChangePassword()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-primary-600 mb-1">Contraseña actual</label>
                  <input [(ngModel)]="currentPassword" name="currentPassword" type="password" required class="w-full"
                         placeholder="Tu contraseña actual" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-primary-600 mb-1">Nueva contraseña</label>
                  <input [(ngModel)]="newPassword" name="newPassword" type="password" required minlength="8" class="w-full"
                         placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-primary-600 mb-1">Confirmar nueva contraseña</label>
                  <input [(ngModel)]="confirmNewPassword" name="confirmNewPassword" type="password" required class="w-full"
                         placeholder="Repetí la nueva contraseña" />
                </div>

                @if (passwordError()) {
                  <p class="text-sm text-danger-500 bg-red-50 rounded-lg p-2">{{ passwordError() }}</p>
                }

                <button
                  type="submit"
                  [disabled]="savingPassword()"
                  class="w-full btn-primary py-2.5">
                  @if (savingPassword()) {
                    Cambiando...
                  } @else {
                    Cambiar contraseña
                  }
                </button>
              </form>
            </div>
          }
        </div>

        <!-- Strava Connection Card (only for athletes) -->
        @if (isAthlete) {
          <div class="card-glass rounded-xl p-6">
            <div class="flex items-center gap-3 mb-4">
              <svg aria-hidden="true" viewBox="0 0 24 24" class="w-7 h-7" fill="#FC4C02">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              <h2 class="text-lg font-semibold text-primary-700">Strava</h2>
            </div>

            @if (stravaSuccess()) {
              <p class="text-sm text-success-500 bg-green-50 rounded-lg p-2 mb-3">Strava conectado exitosamente</p>
            }

            @if (stravaLoading()) {
              <p class="text-sm text-primary-400">Cargando estado...</p>
            } @else if (stravaStatus()?.connected) {
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  <span class="text-sm font-medium text-green-700">Conectado</span>
                </div>
                <p class="text-xs text-primary-400">
                  Athlete ID: {{ stravaStatus()!.athleteId }}
                </p>
                @if (stravaStatus()!.connectedAt) {
                  <p class="text-xs text-primary-400">
                    Conectado desde: {{ formatDate(stravaStatus()!.connectedAt!) }}
                  </p>
                }
                <p class="text-xs text-primary-400 mt-2">
                  Las actividades que subas a Strava se sincronizarán automáticamente con tus sesiones.
                </p>
                <button
                  type="button"
                  (click)="disconnectStrava()"
                  [disabled]="stravaLoading()"
                  class="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm text-white font-medium hover:bg-red-600 disabled:opacity-50">
                  Desconectar
                </button>
              </div>
            } @else {
              <p class="text-sm text-primary-500 mb-3">
                Conectá tu cuenta de Strava para sincronizar automáticamente los datos de tus actividades
                (frecuencia cardíaca, ritmo, distancia, elevación y más).
              </p>
              <p class="text-xs text-primary-400 mb-4">
                Funciona con todos los relojes: Garmin, Polar, COROS, Apple Watch, Suunto.
              </p>
              <button
                type="button"
                (click)="connectStrava()"
                [disabled]="stravaLoading()"
                class="rounded-lg px-4 py-2.5 text-sm text-white font-medium disabled:opacity-50"
                style="background-color: #FC4C02;">
                Conectar con Strava
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private workoutPlansService = inject(WorkoutPlansService);
  private stravaService = inject(StravaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  email = '';
  firstName = '';
  lastName = '';
  birthDate = '';
  phone = '';
  address = '';
  saving = signal(false);
  success = signal(false);
  error = signal('');

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  savingPassword = signal(false);
  passwordError = signal('');
  passwordOpen = signal(false);

  isAthlete = false;
  stravaStatus = signal<StravaStatus | null>(null);
  stravaLoading = signal(false);
  stravaSuccess = signal(false);

  // Stats
  statsLoading = signal(false);
  private planSummaries = signal<PlanSummary[]>([]);

  initials = computed(() => {
    const f = this.firstName?.charAt(0) ?? '';
    const l = this.lastName?.charAt(0) ?? '';
    return (f + l).toUpperCase() || '?';
  });

  totalSessions = computed(() => {
    return this.planSummaries().reduce((sum, p) =>
      sum + p.weekStats.reduce((ws, w) => ws + w.completed, 0), 0);
  });

  totalKm = computed(() => {
    const km = this.planSummaries().reduce((sum, p) =>
      sum + p.weekStats.reduce((ws, w) => ws + w.totalDistance, 0), 0);
    return Math.round(km);
  });

  avgCompletion = computed(() => {
    const plans = this.planSummaries();
    if (!plans.length) return 0;
    const avg = plans.reduce((sum, p) => sum + p.overallCompletionPct, 0) / plans.length;
    return Math.round(avg);
  });

  totalMinutes = computed(() => {
    return this.planSummaries().reduce((sum, p) =>
      sum + p.weekStats.reduce((ws, w) => ws + w.totalDuration, 0), 0);
  });

  avgRpe = computed(() => {
    const plans = this.planSummaries();
    let totalRpe = 0;
    let count = 0;
    for (const p of plans) {
      for (const w of p.weekStats) {
        if (w.avgRpe !== null) {
          totalRpe += w.avgRpe * w.completed;
          count += w.completed;
        }
      }
    }
    return count > 0 ? (totalRpe / count).toFixed(1) : '-';
  });

  constructor() {
    this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
      if (params['strava'] === 'connected') {
        this.stravaSuccess.set(true);
        this.authService.fetchCurrentUser().subscribe();
      }
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.email = user.email;
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.birthDate = user.birthDate ? user.birthDate.substring(0, 10) : '';
      this.phone = user.phone ?? '';
      this.address = user.address ?? '';
      this.isAthlete = this.authService.isAthlete();
    }

    if (this.isAthlete && user) {
      this.loadStravaStatus();
      this.loadStats(user._id);
    }
  }

  loadStats(athleteId: string) {
    this.statsLoading.set(true);
    this.workoutPlansService.getAthleteSummary(athleteId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: summaries => {
        this.planSummaries.set(summaries);
        this.statsLoading.set(false);
      },
      error: () => this.statsLoading.set(false),
    });
  }

  loadStravaStatus() {
    this.stravaLoading.set(true);
    this.stravaService.getStatus().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: status => {
        this.stravaStatus.set(status);
        this.stravaLoading.set(false);
      },
      error: () => this.stravaLoading.set(false),
    });
  }

  connectStrava() {
    this.stravaLoading.set(true);
    this.stravaService.getAuthUrl().subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: () => this.stravaLoading.set(false),
    });
  }

  disconnectStrava() {
    if (!confirm('¿Desconectar Strava? Se dejarán de sincronizar las actividades.')) return;

    this.stravaLoading.set(true);
    this.stravaService.disconnect().subscribe({
      next: () => {
        this.stravaStatus.set({ connected: false });
        this.stravaSuccess.set(false);
        this.stravaLoading.set(false);
        this.authService.fetchCurrentUser().subscribe();
      },
      error: () => this.stravaLoading.set(false),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  calculatedAge(): number | null {
    if (!this.birthDate) return null;
    const today = new Date();
    const birth = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  onChangePassword() {
    this.passwordError.set('');

    if (this.newPassword.length < 6) {
      this.passwordError.set('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError.set('Las contraseñas no coinciden');
      return;
    }

    this.savingPassword.set(true);
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.toast.success('Contraseña actualizada');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.savingPassword.set(false);
      },
      error: () => {
        this.passwordError.set('Contraseña actual incorrecta');
        this.savingPassword.set(false);
      },
    });
  }

  goBack() {
    this.router.navigateByUrl(this.authService.getRedirectUrl());
  }

  onSubmit() {
    this.saving.set(true);
    this.success.set(false);
    this.error.set('');

    const user = this.authService.currentUser()!;
    this.usersService.update(user._id, {
      firstName: this.firstName,
      lastName: this.lastName,
      birthDate: this.birthDate || undefined,
      phone: this.phone || undefined,
      address: this.address || undefined,
    }).subscribe({
      next: () => {
        this.authService.fetchCurrentUser().subscribe();
        this.toast.success('Perfil actualizado');
        this.success.set(true);
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Error al actualizar el perfil');
        this.error.set('Error al actualizar el perfil');
        this.saving.set(false);
      },
    });
  }
}
