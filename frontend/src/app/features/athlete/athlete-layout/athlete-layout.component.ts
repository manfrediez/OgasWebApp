import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { MessagesService } from '../../../services/messages.service';

@Component({
  selector: 'app-athlete-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent],
  template: `
    <div class="flex flex-col h-screen">
      <app-navbar />
      <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative z-[1]">
        <router-outlet />
      </main>

      <!-- Bottom tabs (mobile) -->
      <nav class="fixed bottom-0 left-0 right-0 card-glass-static border-t border-white/20 flex md:hidden z-10">
        @for (tab of tabs; track tab.route) {
          <a
            [routerLink]="tab.route"
            routerLinkActive="text-accent-500 border-t-2 border-accent-500"
            class="flex-1 flex flex-col items-center py-2 text-xs text-primary-400 border-t-2 border-transparent relative">
            <span class="text-lg">{{ tab.icon }}</span>
            <span class="text-[10px] md:text-xs">{{ tab.label }}</span>
            @if (tab.badge && tab.badge() > 0) {
              <span class="absolute top-0.5 right-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold">
                {{ tab.badge() }}
              </span>
            }
          </a>
        }
      </nav>

      <!-- Sidebar (desktop) -->
      <aside class="hidden md:flex fixed left-0 top-[52px] bottom-0 w-56 sidebar-glass text-white flex-col py-4 z-10">
        @for (tab of tabs; track tab.route) {
          <a
            [routerLink]="tab.route"
            routerLinkActive="bg-white/15 border-l-4 border-accent-400"
            class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 transition-all border-l-4 border-transparent">
            <span class="text-lg">{{ tab.icon }}</span>
            <span class="flex-1">{{ tab.label }}</span>
            @if (tab.badge && tab.badge() > 0) {
              <span class="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent-500 text-white text-xs font-bold">
                {{ tab.badge() }}
              </span>
            }
          </a>
        }
      </aside>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @media (min-width: 768px) {
      main { margin-left: 14rem; }
    }
  `],
})
export class AthleteLayoutComponent implements OnInit, OnDestroy {
  private messagesService = inject(MessagesService);

  tabs = [
    { label: 'Inicio', route: '/athlete/dashboard', icon: '🏠', badge: undefined as (() => number) | undefined },
    { label: 'Mi Plan', route: '/athlete/plan', icon: '📋', badge: undefined as (() => number) | undefined },
    { label: 'Info', route: '/athlete/info', icon: '📚', badge: undefined as (() => number) | undefined },
    { label: 'Fuerza', route: '/athlete/strength', icon: '💪', badge: undefined as (() => number) | undefined },
    { label: 'Carreras', route: '/athlete/races', icon: '🏁', badge: undefined as (() => number) | undefined },
    { label: 'Métricas', route: '/athlete/metrics', icon: '📈', badge: undefined as (() => number) | undefined },
    { label: 'Mensajes', route: '/athlete/messages', icon: '💬', badge: () => this.messagesService.unreadCount() },
  ];

  ngOnInit() {
    this.messagesService.startUnreadPolling();
  }

  ngOnDestroy() {
    this.messagesService.stopUnreadPolling();
  }
}
