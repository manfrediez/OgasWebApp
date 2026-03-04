import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../services/users.service';
import { CommandPaletteService } from '../../services/command-palette.service';

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  section: string;
  route: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  template: `
    @if (paletteService.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" (click)="onBackdropClick($event)">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-lg mx-4 card-glass rounded-2xl shadow-2xl overflow-hidden">
          <!-- Search input -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-primary-200">
            <svg class="w-5 h-5 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              #searchInput
              type="text"
              placeholder="Buscar..."
              [value]="searchTerm()"
              (input)="onSearch($event)"
              (keydown)="onKeydown($event)"
              class="flex-1 bg-transparent text-primary-700 text-sm outline-none placeholder:text-primary-300" />
            <kbd class="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-primary-200 text-[10px] font-medium text-primary-400">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-[50vh] overflow-y-auto py-2">
            @if (filteredItems().length === 0 && searchTerm()) {
              <p class="px-4 py-6 text-center text-sm text-primary-400">No se encontraron resultados</p>
            }

            @for (section of sections(); track section) {
              <div class="px-3 pt-2 pb-1">
                <p class="text-[10px] font-semibold text-primary-400 uppercase tracking-wider px-1">{{ section }}</p>
              </div>
              @for (item of getItemsForSection(section); track item.id) {
                <button
                  (click)="selectItem(item)"
                  [class]="selectedIndex() === getGlobalIndex(item)
                    ? 'w-full flex items-center gap-3 px-4 py-2.5 text-sm bg-accent-500/10 text-accent-700'
                    : 'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50'"
                  (mouseenter)="selectedIndex.set(getGlobalIndex(item))">
                  <span class="text-base">{{ item.icon }}</span>
                  <span class="flex-1 text-left truncate">{{ item.label }}</span>
                  @if (selectedIndex() === getGlobalIndex(item)) {
                    <kbd class="text-[10px] text-primary-400">Enter</kbd>
                  }
                </button>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private destroyRef = inject(DestroyRef);
  paletteService = inject(CommandPaletteService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchTerm = signal('');
  selectedIndex = signal(0);
  athleteResults = signal<CommandItem[]>([]);

  private searchSubject = new Subject<string>();
  private keyHandler = this.handleGlobalKey.bind(this);

  private staticItems = computed<CommandItem[]>(() => {
    if (this.authService.isCoach()) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'Navegación', route: '/coach/dashboard' },
        { id: 'athletes', label: 'Atletas', icon: '🏃', section: 'Navegación', route: '/coach/athletes' },
        { id: 'inactive', label: 'Inactivos', icon: '⏸️', section: 'Navegación', route: '/coach/inactive' },
        { id: 'messages', label: 'Mensajes', icon: '💬', section: 'Navegación', route: '/coach/messages' },
        { id: 'invite', label: 'Invitar Atleta', icon: '✉️', section: 'Acciones', route: '/coach/invite' },
        { id: 'info', label: 'Info', icon: '📚', section: 'Navegación', route: '/coach/info' },
      ];
    }
    return [
      { id: 'dashboard', label: 'Inicio', icon: '🏠', section: 'Navegación', route: '/athlete/dashboard' },
      { id: 'plan', label: 'Mi Plan', icon: '📋', section: 'Navegación', route: '/athlete/plan' },
      { id: 'strength', label: 'Fuerza', icon: '💪', section: 'Navegación', route: '/athlete/strength' },
      { id: 'races', label: 'Carreras', icon: '🏁', section: 'Navegación', route: '/athlete/races' },
      { id: 'metrics', label: 'Métricas', icon: '📈', section: 'Navegación', route: '/athlete/metrics' },
      { id: 'messages', label: 'Mensajes', icon: '💬', section: 'Navegación', route: '/athlete/messages' },
      { id: 'info', label: 'Info', icon: '📚', section: 'Navegación', route: '/athlete/info' },
    ];
  });

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const statics = this.staticItems();
    const athletes = this.athleteResults();
    const all = [...statics, ...athletes];
    if (!term) return all;
    return all.filter(item => item.label.toLowerCase().includes(term));
  });

  sections = computed(() => {
    const items = this.filteredItems();
    return [...new Set(items.map(i => i.section))];
  });

  ngOnInit() {
    document.addEventListener('keydown', this.keyHandler);

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term.trim() || !this.authService.isCoach()) return of([]);
        return this.usersService.getAthletesGrid(1, 5, term);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(result => {
      if (Array.isArray(result)) {
        this.athleteResults.set([]);
        return;
      }
      this.athleteResults.set(
        result.data.map(a => ({
          id: `athlete-${a._id}`,
          label: `${a.firstName} ${a.lastName}`,
          icon: '👤',
          section: 'Atletas',
          route: `/coach/athlete/${a._id}`,
        }))
      );
    });
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.keyHandler);
  }

  private handleGlobalKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.paletteService.toggle();
      if (this.paletteService.isOpen()) {
        this.searchTerm.set('');
        this.selectedIndex.set(0);
        this.athleteResults.set([]);
        setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
      }
    }
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.selectedIndex.set(0);
    this.searchSubject.next(value);
  }

  onKeydown(e: KeyboardEvent) {
    const items = this.filteredItems();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex.update(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex.update(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[this.selectedIndex()];
      if (item) this.selectItem(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.paletteService.close();
    }
  }

  selectItem(item: CommandItem) {
    this.paletteService.close();
    this.router.navigate([item.route]);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.paletteService.close();
    }
  }

  getItemsForSection(section: string): CommandItem[] {
    return this.filteredItems().filter(i => i.section === section);
  }

  getGlobalIndex(item: CommandItem): number {
    return this.filteredItems().indexOf(item);
  }
}
