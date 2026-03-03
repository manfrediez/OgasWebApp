import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invite-athlete',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="max-w-lg">
      <h1 class="text-2xl font-bold text-primary-700 mb-6">Invitar Atleta</h1>

      <form (ngSubmit)="onSubmit()" class="bg-surface rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Nombre</label>
          <input [(ngModel)]="firstName" name="firstName" required class="w-full" placeholder="Nombre" />
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Apellido</label>
          <input [(ngModel)]="lastName" name="lastName" required class="w-full" placeholder="Apellido" />
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-600 mb-1">Email</label>
          <input [(ngModel)]="email" name="email" type="email" required class="w-full" placeholder="atleta@email.com" />
        </div>

        @if (error()) {
          <p class="text-sm text-danger-500 bg-red-50 rounded-lg p-2">{{ error() }}</p>
        }

        @if (inviteLink()) {
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-sm font-medium text-green-800 mb-2">Invitación creada exitosamente</p>
            <p class="text-xs text-green-700 break-all">{{ inviteLink() }}</p>
          </div>
        }

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full rounded-lg bg-primary-500 py-2.5 text-white font-medium hover:bg-primary-700 disabled:opacity-50">
          @if (loading()) {
            Enviando...
          } @else {
            Enviar Invitación
          }
        </button>
      </form>
    </div>
  `,
})
export class InviteAthleteComponent {
  private authService = inject(AuthService);

  firstName = '';
  lastName = '';
  email = '';
  loading = signal(false);
  error = signal('');
  inviteLink = signal('');

  onSubmit() {
    this.loading.set(true);
    this.error.set('');
    this.inviteLink.set('');

    this.authService.inviteAthlete({
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
    }).subscribe({
      next: res => {
        this.inviteLink.set(res.inviteLink);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al crear la invitación');
        this.loading.set(false);
      },
    });
  }
}
