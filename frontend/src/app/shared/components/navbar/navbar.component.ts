import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MessagesService } from '../../../services/messages.service';
import { Role } from '../../../core/models/enums';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="navbar-glass text-white px-4 py-3 flex items-center justify-between relative z-10">
      <div class="flex items-center gap-2 md:gap-3">
        <img src="assets/images/logo.jpeg" alt="Logo" class="h-10 w-10 rounded-full object-cover" />
        <span class="text-lg font-bold tracking-wide hidden md:inline">Hernan Ogas Trail Running</span>
      </div>
      @if (auth.currentUser(); as user) {
        <div class="flex items-center gap-2 md:gap-4">
          <button (click)="goToMessages()" class="relative p-1.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            @if (messagesService.unreadCount() > 0) {
              <span class="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {{ messagesService.unreadCount() > 99 ? '99+' : messagesService.unreadCount() }}
              </span>
            }
          </button>
          <a routerLink="/profile" class="text-sm text-primary-100 hidden md:inline hover:text-white hover:underline cursor-pointer">{{ user.firstName }} {{ user.lastName }}</a>
          <button
            (click)="auth.logout()"
            class="rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 text-xs md:text-sm md:px-3 hover:bg-white/20 transition-all">
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
  private router = inject(Router);

  goToMessages(): void {
    const user = this.auth.currentUser();
    if (user?.role === Role.COACH) {
      this.router.navigate(['/coach/messages']);
    } else {
      this.router.navigate(['/athlete/messages']);
    }
  }
}
