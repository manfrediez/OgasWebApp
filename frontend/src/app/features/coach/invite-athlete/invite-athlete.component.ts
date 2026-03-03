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

      <form (ngSubmit)="onSubmit()" class="card-glass rounded-xl p-6 space-y-4">
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
          <div class="bg-green-50 rounded-lg p-4 space-y-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm font-medium text-green-800">
                @if (emailSent()) {
                  Invitación enviada por email exitosamente
                } @else {
                  Invitación creada (email no configurado, compartí el link manualmente)
                }
              </p>
            </div>
            <div class="flex gap-2">
              <input
                readonly
                [value]="inviteLink()"
                class="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 text-green-700 cursor-text" />
              <button
                type="button"
                (click)="copyLink()"
                class="shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                [class]="copied() ? 'bg-green-600 text-white' : 'bg-white border border-green-300 text-green-700 hover:bg-green-100'">
                {{ copied() ? 'Copiado!' : 'Copiar' }}
              </button>
            </div>
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
  emailSent = signal(false);
  copied = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.error.set('');
    this.inviteLink.set('');
    this.emailSent.set(false);
    this.copied.set(false);

    this.authService.inviteAthlete({
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
    }).subscribe({
      next: res => {
        this.inviteLink.set(res.inviteLink);
        this.emailSent.set(res.emailSent);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.status === 409
          ? 'Ya existe un atleta registrado con ese email'
          : 'Error al crear la invitación';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.inviteLink()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
