import { Routes } from '@angular/router';

export const ATHLETE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./athlete-layout/athlete-layout.component').then(m => m.AthleteLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'plan',
        loadComponent: () =>
          import('./my-plan/my-plan.component').then(m => m.MyPlanComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./messages/athlete-chat.component').then(m => m.AthleteChatComponent),
      },
      {
        path: 'metrics',
        loadComponent: () =>
          import('./my-metrics/my-metrics.component').then(m => m.MyMetricsComponent),
      },
      {
        path: 'races',
        loadComponent: () =>
          import('./my-races/my-races.component').then(m => m.MyRacesComponent),
      },
      {
        path: 'strength',
        loadComponent: () =>
          import('./my-strength/my-strength.component').then(m => m.MyStrengthComponent),
      },
      {
        path: 'info',
        loadComponent: () =>
          import('./general-info/athlete-info-topics.component').then(m => m.AthleteInfoTopicsComponent),
      },
      {
        path: 'info/:topicId',
        loadComponent: () =>
          import('./general-info/athlete-info-posts.component').then(m => m.AthleteInfoPostsComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
