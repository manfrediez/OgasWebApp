import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, CommandPaletteComponent],
  template: `<div class="bg-animated-gradient min-h-screen relative"><router-outlet /><app-toast-container /><app-command-palette /></div>`,
})
export class AppComponent {}
