import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/enums';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'accept-invite',
    loadComponent: () =>
      import('./features/auth/accept-invite/accept-invite.component').then(m => m.AcceptInviteComponent),
  },
  {
    path: 'coach',
    canActivate: [authGuard, roleGuard(Role.COACH)],
    loadChildren: () =>
      import('./features/coach/coach.routes').then(m => m.COACH_ROUTES),
  },
  {
    path: 'athlete',
    canActivate: [authGuard, roleGuard(Role.ATHLETE)],
    loadChildren: () =>
      import('./features/athlete/athlete.routes').then(m => m.ATHLETE_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
