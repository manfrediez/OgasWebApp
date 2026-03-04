import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
            [attr.aria-label]="tab.label"
            class="flex-1 flex flex-col items-center py-2 text-xs text-primary-400 border-t-2 border-transparent relative">
            <span class="w-5 h-5" [innerHTML]="tab.svg"></span>
            <span class="text-xs">{{ tab.label }}</span>
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
            [attr.aria-label]="tab.label"
            class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-primary-50 transition-all border-l-4 border-transparent">
            <span class="w-5 h-5" [innerHTML]="tab.svg"></span>
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
  private sanitizer = inject(DomSanitizer);

  private svg(s: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(s); }

  tabs = [
    { label: 'Dashboard', route: '/coach/dashboard', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Info', route: '/coach/info', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Atletas', route: '/coach/athletes', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Inactivos', route: '/coach/inactive', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Mensajes', route: '/coach/messages', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/></svg>'), badge: () => this.messagesService.unreadCount() },
    { label: 'Invitar', route: '/coach/invite', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>'), badge: undefined as (() => number) | undefined },
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
