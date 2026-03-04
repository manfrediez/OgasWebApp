import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MessagesService } from '../../../services/messages.service';
import { ThemeService } from '../../services/theme.service';
import { CommandPaletteService } from '../../services/command-palette.service';
import { Role } from '../../../core/models/enums';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav aria-label="Navegación principal" class="navbar-glass text-primary-700 px-4 py-3 flex items-center justify-between relative z-10">
      <a (click)="goHome()" class="flex items-center gap-2 md:gap-3 cursor-pointer">
        <img src="assets/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-full object-cover" />
        <span class="text-lg font-bold tracking-wide hidden md:inline">Hernan Ogas Trail Running</span>
      </a>
      @if (auth.currentUser(); as user) {
        <div class="flex items-center gap-2 md:gap-4">
          <button (click)="paletteService.open()" aria-label="Buscar" class="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary-200 text-sm text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-all">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <span class="text-xs">Buscar...</span>
            <kbd class="ml-1 px-1.5 py-0.5 rounded border border-primary-200 text-[10px] font-medium">⌘K</kbd>
          </button>
          <button (click)="theme.toggle()" [attr.aria-label]="theme.darkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" class="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 border border-transparent hover:border-primary-200 transition-all">
            @if (theme.darkMode()) {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            }
          </button>
          <button (click)="goToMessages()" aria-label="Mensajes" class="relative p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 border border-transparent hover:border-primary-200 transition-all">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            @if (messagesService.unreadCount() > 0) {
              <span class="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold leading-none">
                {{ messagesService.unreadCount() > 99 ? '99+' : messagesService.unreadCount() }}
              </span>
            }
          </button>
          <a routerLink="/profile" class="text-sm text-primary-500 hidden md:inline hover:text-primary-700 hover:underline cursor-pointer">{{ user.firstName }} {{ user.lastName }}</a>
          <button
            (click)="auth.logout()"
            class="rounded-lg border border-primary-200 px-2 py-1.5 text-xs md:text-sm md:px-3 text-primary-600 hover:bg-primary-50 transition-all">
            Cerrar sesión
          </button>
        </div>
      }
    </nav>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  messagesService = inject(MessagesService);
  theme = inject(ThemeService);
  paletteService = inject(CommandPaletteService);
  private router = inject(Router);

  goHome(): void {
    const user = this.auth.currentUser();
    if (user?.role === Role.COACH) {
      this.router.navigate(['/coach']);
    } else {
      this.router.navigate(['/athlete']);
    }
  }

  goToMessages(): void {
    const user = this.auth.currentUser();
    if (user?.role === Role.COACH) {
      this.router.navigate(['/coach/messages']);
    } else {
      this.router.navigate(['/athlete/messages']);
    }
  }
}
