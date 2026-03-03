import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../services/users.service';
import { StravaService, StravaStatus } from '../../services/strava.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';

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

        <form (ngSubmit)="onSubmit()" class="card-glass rounded-xl p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Email</label>
            <input [value]="email" disabled class="w-full bg-surface-alt" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Nombre</label>
            <input [(ngModel)]="firstName" #fnInput="ngModel" name="firstName" required class="w-full"
                   [class.border-danger-500]="fnInput.invalid && fnInput.touched" />
            @if (fnInput.invalid && fnInput.touched) {
              <p class="text-xs text-danger-500 mt-1">El nombre es obligatorio</p>
            }
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Apellido</label>
            <input [(ngModel)]="lastName" #lnInput="ngModel" name="lastName" required class="w-full"
                   [class.border-danger-500]="lnInput.invalid && lnInput.touched" />
            @if (lnInput.invalid && lnInput.touched) {
              <p class="text-xs text-danger-500 mt-1">El apellido es obligatorio</p>
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
            class="w-full rounded-lg bg-primary-500 py-2.5 text-white font-medium hover:bg-primary-700 disabled:opacity-50">
            @if (saving()) {
              Guardando...
            } @else {
              Guardar Cambios
            }
          </button>
        </form>

        <!-- Strava Connection Card (only for athletes) -->
        @if (isAthlete) {
          <div class="mt-6 card-glass rounded-xl p-6">
            <div class="flex items-center gap-3 mb-4">
              <svg viewBox="0 0 24 24" class="w-7 h-7" fill="#FC4C02">
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
  private stravaService = inject(StravaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  email = '';
  firstName = '';
  lastName = '';
  birthDate = '';
  phone = '';
  address = '';
  saving = signal(false);
  success = signal(false);
  error = signal('');

  isAthlete = false;
  stravaStatus = signal<StravaStatus | null>(null);
  stravaLoading = signal(false);
  stravaSuccess = signal(false);

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

    if (this.isAthlete) {
      this.loadStravaStatus();

      this.route.queryParams.subscribe(params => {
        if (params['strava'] === 'connected') {
          this.stravaSuccess.set(true);
          this.authService.fetchCurrentUser().subscribe();
        }
      });
    }
  }

  loadStravaStatus() {
    this.stravaLoading.set(true);
    this.stravaService.getStatus().subscribe({
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
