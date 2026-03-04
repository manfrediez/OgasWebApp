import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (onboarding.shouldShow()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="onBackdropClick($event)">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-md card-glass rounded-2xl shadow-2xl overflow-hidden">
          <!-- Progress dots -->
          <div class="flex items-center justify-center gap-2 pt-5">
            @for (s of [0, 1, 2]; track s) {
              <div class="h-1.5 rounded-full transition-all duration-300"
                [class]="step() === s ? 'w-6 bg-accent-500' : 'w-1.5 bg-primary-200'"></div>
            }
          </div>

          <!-- Step content -->
          <div class="px-6 py-8 text-center">
            @switch (step()) {
              @case (0) {
                <div class="text-5xl mb-4">👋</div>
                <h2 class="text-xl font-bold text-primary-800 mb-2">¡Bienvenido a OgasWeb!</h2>
                <p class="text-sm text-primary-500 leading-relaxed">
                  Tu plataforma de coaching para gestionar atletas, crear planes de entrenamiento y hacer seguimiento del progreso de tu equipo.
                </p>
              }
              @case (1) {
                <div class="text-5xl mb-4">✉️</div>
                <h2 class="text-xl font-bold text-primary-800 mb-2">Invitá a tu primer atleta</h2>
                <p class="text-sm text-primary-500 leading-relaxed">
                  Enviá una invitación por email para que tus atletas se sumen a la plataforma y puedan ver sus planes y darte feedback.
                </p>
              }
              @case (2) {
                <div class="text-5xl mb-4">🚀</div>
                <h2 class="text-xl font-bold text-primary-800 mb-2">Todo listo</h2>
                <p class="text-sm text-primary-500 leading-relaxed mb-4">
                  Desde el menú lateral podés acceder a todas las secciones:
                </p>
                <div class="grid grid-cols-2 gap-2 text-left">
                  <div class="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
                    <span>📊</span>
                    <span class="text-xs font-medium text-primary-600">Dashboard</span>
                  </div>
                  <div class="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
                    <span>🏃</span>
                    <span class="text-xs font-medium text-primary-600">Atletas</span>
                  </div>
                  <div class="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
                    <span>💬</span>
                    <span class="text-xs font-medium text-primary-600">Mensajes</span>
                  </div>
                  <div class="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
                    <span>📚</span>
                    <span class="text-xs font-medium text-primary-600">Info</span>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6 flex items-center justify-between">
            <button (click)="skip()" class="text-sm text-primary-400 hover:text-primary-600 transition-colors">
              Omitir
            </button>
            <div class="flex items-center gap-2">
              @if (step() > 0) {
                <button (click)="prev()" class="px-4 py-2 rounded-lg border border-primary-200 text-sm text-primary-600 hover:bg-primary-50 transition-all">
                  Atrás
                </button>
              }
              @if (step() < 2) {
                <button (click)="next()" class="btn-primary text-sm">
                  Siguiente
                </button>
              } @else {
                <a routerLink="/coach/invite" (click)="finish()" class="btn-primary text-sm inline-flex items-center gap-2">
                  Invitar Atleta
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                  </svg>
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class OnboardingComponent {
  onboarding = inject(OnboardingService);
  step = signal(0);

  next() {
    this.step.update(s => Math.min(s + 1, 2));
  }

  prev() {
    this.step.update(s => Math.max(s - 1, 0));
  }

  skip() {
    this.onboarding.complete();
  }

  finish() {
    this.onboarding.complete();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.onboarding.dismiss();
    }
  }
}
