import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly STORAGE_KEY = 'onboarding_completed';
  readonly shouldShow = signal(false);

  checkOnboarding(athleteCount: number): void {
    const completed = localStorage.getItem(this.STORAGE_KEY);
    if (!completed && athleteCount === 0) {
      this.shouldShow.set(true);
    }
  }

  complete(): void {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.shouldShow.set(false);
  }

  dismiss(): void {
    this.shouldShow.set(false);
  }
}
