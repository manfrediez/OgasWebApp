import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/enums';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const user = authService.currentUser();
  if (user?.role === Role.COACH) {
    return router.createUrlTree(['/coach/dashboard']);
  }
  return router.createUrlTree(['/athlete/plan']);
};
