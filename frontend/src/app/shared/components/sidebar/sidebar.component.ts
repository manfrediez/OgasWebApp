import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarItem {
  label: string;
  route: string;
  icon: string;
  badge?: () => number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="w-60 sidebar-glass text-primary-600 min-h-full flex flex-col">
      <nav aria-label="Menú lateral" class="flex-1 py-4">
        @for (item of items(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary-50 border-l-4 border-accent-500 text-accent-600"
            class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-primary-50 transition-all border-l-4 border-transparent">
            <span class="text-lg">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span>
            @if (item.badge && item.badge() > 0) {
              <span class="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent-500 text-white text-xs font-bold">
                {{ item.badge() }}
              </span>
            }
          </a>
        }
      </nav>
    </aside>
  `,
})
export class SidebarComponent {
  items = input.required<SidebarItem[]>();
}
