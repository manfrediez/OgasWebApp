import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { MessagesService } from '../../../services/messages.service';
import { routeAnimation } from '../../../shared/animations/route.animation';

@Component({
  selector: 'app-coach-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent],
  animations: [routeAnimation],
  template: `
    <div class="flex flex-col h-screen">
      <app-navbar />
      <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 relative z-[1]" [@routeAnimation]="getRouteAnimationData()">
        <router-outlet />
      </main>

      <!-- Bottom tabs (mobile) -->
      <nav class="fixed bottom-0 left-0 right-0 card-glass-static border-t border-primary-200 flex md:hidden z-10">
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
      <aside class="hidden md:flex fixed left-0 top-[52px] bottom-0 w-56 sidebar-glass text-primary-600 flex-col py-4 z-10">
        @for (tab of tabs; track tab.route) {
          <a
            [routerLink]="tab.route"
            routerLinkActive="bg-primary-50 border-l-4 border-accent-500 text-accent-600"
            class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-primary-50 transition-all border-l-4 border-transparent">
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
export class CoachLayoutComponent implements OnInit, OnDestroy {
  private messagesService = inject(MessagesService);
  private contexts = inject(ChildrenOutletContexts);

  tabs = [
    { label: 'Dashboard', route: '/coach/dashboard', icon: '📊', badge: undefined as (() => number) | undefined },
    { label: 'Info', route: '/coach/info', icon: '📚', badge: undefined as (() => number) | undefined },
    { label: 'Atletas', route: '/coach/athletes', icon: '🏃', badge: undefined as (() => number) | undefined },
    { label: 'Inactivos', route: '/coach/inactive', icon: '⏸️', badge: undefined as (() => number) | undefined },
    { label: 'Mensajes', route: '/coach/messages', icon: '💬', badge: () => this.messagesService.unreadCount() },
    { label: 'Invitar', route: '/coach/invite', icon: '✉️', badge: undefined as (() => number) | undefined },
  ];

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.url;
  }

  ngOnInit() {
    this.messagesService.startUnreadPolling();
  }

  ngOnDestroy() {
    this.messagesService.stopUnreadPolling();
  }
}
