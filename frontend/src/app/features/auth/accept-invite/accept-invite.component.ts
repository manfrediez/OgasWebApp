import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="dialog-glass rounded-2xl p-8 w-full max-w-sm">
        <div class="flex flex-col items-center mb-8">
          <img src="assets/images/logo.jpeg" alt="Logo" class="h-24 w-24 rounded-full object-cover mb-4 shadow-lg" />
          <h1 class="text-xl font-bold text-primary-700">Bienvenido al equipo</h1>
          <p class="text-sm text-primary-400">Creá tu contraseña para comenzar</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
          <div>
            <label for="password" class="block text-sm font-medium text-primary-600 mb-1">Contraseña</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              #passwordInput="ngModel"
              name="password"
              required
              minlength="6"
              class="w-full"
              [class.border-danger-500]="passwordInput.invalid && passwordInput.touched"
              placeholder="Mínimo 6 caracteres" />
            @if (passwordInput.touched && passwordInput.errors?.['required']) {
              <p class="text-xs text-danger-500 mt-1">La contraseña es obligatoria</p>
            } @else if (passwordInput.touched && passwordInput.errors?.['minlength']) {
              <p class="text-xs text-danger-500 mt-1">Mínimo 6 caracteres</p>
            }
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-primary-600 mb-1">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              [(ngModel)]="confirmPassword"
              #confirmInput="ngModel"
              name="confirmPassword"
              required
              class="w-full"
              [class.border-danger-500]="(confirmInput.touched && confirmInput.invalid) || (confirmInput.touched && password !== confirmPassword && confirmPassword)"
              placeholder="Repetí tu contraseña" />
            @if (confirmInput.touched && confirmInput.errors?.['required']) {
              <p class="text-xs text-danger-500 mt-1">Confirmá tu contraseña</p>
            } @else if (confirmInput.touched && password !== confirmPassword && confirmPassword) {
              <p class="text-xs text-danger-500 mt-1">Las contraseñas no coinciden</p>
            }
          </div>

          @if (error()) {
            <p class="text-sm text-danger-500 bg-red-500/10 backdrop-blur-sm rounded-lg p-2">{{ error() }}</p>
          }

          @if (success()) {
            <p class="text-sm text-success-500 bg-green-500/10 backdrop-blur-sm rounded-lg p-2">{{ success() }}</p>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full btn-primary py-2.5">
            @if (loading()) {
              Creando cuenta...
            } @else {
              Crear cuenta
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AcceptInviteComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private inviteToken = '';
  password = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  ngOnInit() {
    this.inviteToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.inviteToken) {
      this.error.set('Token de invitación inválido');
    }
  }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.acceptInvite({ inviteToken: this.inviteToken, password: this.password }).pipe(
      switchMap(() => this.authService.fetchCurrentUser()),
    ).subscribe({
      next: () => {
        this.router.navigateByUrl(this.authService.getRedirectUrl());
      },
      error: () => {
        this.error.set('Token inválido o expirado');
        this.loading.set(false);
      },
    });
  }
}
