import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../services/users.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

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

        <form (ngSubmit)="onSubmit()" class="bg-surface rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Email</label>
            <input [value]="email" disabled class="w-full bg-surface-alt" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Nombre</label>
            <input [(ngModel)]="firstName" name="firstName" required class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-600 mb-1">Apellido</label>
            <input [(ngModel)]="lastName" name="lastName" required class="w-full" />
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
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  email = '';
  firstName = '';
  lastName = '';
  birthDate = '';
  phone = '';
  address = '';
  saving = signal(false);
  success = signal(false);
  error = signal('');

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.email = user.email;
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.birthDate = user.birthDate ? user.birthDate.substring(0, 10) : '';
      this.phone = user.phone ?? '';
      this.address = user.address ?? '';
    }
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
        this.success.set(true);
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Error al actualizar el perfil');
        this.saving.set(false);
      },
    });
  }
}
