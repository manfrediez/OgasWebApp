import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent, SidebarItem } from '../../../shared/components/sidebar/sidebar.component';
import { MessagesService } from '../../../services/messages.service';

@Component({
  selector: 'app-coach-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="flex flex-col h-screen">
      <app-navbar />
      <div class="flex flex-1 overflow-hidden">
        <app-sidebar [items]="menuItems" />
        <main class="flex-1 overflow-y-auto p-6 relative z-[1]">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class CoachLayoutComponent implements OnInit, OnDestroy {
  private messagesService = inject(MessagesService);

  menuItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/coach/dashboard', icon: '📊' },
    { label: 'Atletas', route: '/coach/athletes', icon: '🏃' },
    { label: 'Inactivos', route: '/coach/inactive', icon: '⏸️' },
    { label: 'Mensajes', route: '/coach/messages', icon: '💬', badge: () => this.messagesService.unreadCount() },
    { label: 'Info General', route: '/coach/info', icon: '📚' },
    { label: 'Invitar Atleta', route: '/coach/invite', icon: '✉️' },
  ];

  ngOnInit() {
    this.messagesService.startUnreadPolling();
  }

  ngOnDestroy() {
    this.messagesService.stopUnreadPolling();
  }
}
