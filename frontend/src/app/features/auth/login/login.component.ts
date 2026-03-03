import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="dialog-glass rounded-2xl p-8 w-full max-w-sm">
        <div class="flex flex-col items-center mb-8">
          <img src="assets/images/logo.jpeg" alt="Logo" class="h-24 w-24 rounded-full object-cover mb-4 shadow-lg" />
          <h1 class="text-xl font-bold text-primary-700">Hernan Ogas</h1>
          <p class="text-sm text-primary-400">Trail Running Team</p>
        </div>

        <form (ngSubmit)="onLogin()" class="flex flex-col gap-4">
          <div>
            <label for="email" class="block text-sm font-medium text-primary-600 mb-1">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full"
              placeholder="tu@email.com" />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-primary-600 mb-1">Contraseña</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="w-full"
              placeholder="••••••" />
          </div>

          @if (error()) {
            <p class="text-sm text-danger-500 bg-red-500/10 backdrop-blur-sm rounded-lg p-2">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full btn-primary py-2.5">
            @if (loading()) {
              Ingresando...
            } @else {
              Iniciar Sesión
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onLogin() {
    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).pipe(
      switchMap(() => this.authService.fetchCurrentUser()),
    ).subscribe({
      next: () => {
        this.router.navigateByUrl(this.authService.getRedirectUrl());
      },
      error: () => {
        this.error.set('Email o contraseña incorrectos');
        this.loading.set(false);
      },
    });
  }
}
