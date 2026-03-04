import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { MessagesService } from '../../../services/messages.service';
import { routeAnimation } from '../../../shared/animations/route.animation';

@Component({
  selector: 'app-athlete-layout',
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
export class AthleteLayoutComponent implements OnInit, OnDestroy {
  private messagesService = inject(MessagesService);
  private contexts = inject(ChildrenOutletContexts);
  private sanitizer = inject(DomSanitizer);

  private svg(s: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(s); }

  tabs = [
    { label: 'Inicio', route: '/athlete/dashboard', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Mi Plan', route: '/athlete/plan', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Info', route: '/athlete/info', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Fuerza', route: '/athlete/strength', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Carreras', route: '/athlete/races', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Métricas', route: '/athlete/metrics', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/></svg>'), badge: undefined as (() => number) | undefined },
    { label: 'Mensajes', route: '/athlete/messages', svg: this.svg('<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/></svg>'), badge: () => this.messagesService.unreadCount() },
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
