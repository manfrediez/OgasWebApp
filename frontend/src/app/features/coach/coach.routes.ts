import { Routes } from '@angular/router';

export const COACH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./coach-layout/coach-layout.component').then(m => m.CoachLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'athletes',
        loadComponent: () =>
          import('./athletes-list/athletes-list.component').then(m => m.AthletesListComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./messages/coach-conversations.component').then(m => m.CoachConversationsComponent),
      },
      {
        path: 'messages/:athleteId',
        loadComponent: () =>
          import('./messages/coach-chat.component').then(m => m.CoachChatComponent),
      },
      {
        path: 'inactive',
        loadComponent: () =>
          import('./inactive-athletes/inactive-athletes.component').then(m => m.InactiveAthletesComponent),
      },
      {
        path: 'info',
        loadComponent: () =>
          import('./general-info/coach-info-topics.component').then(m => m.CoachInfoTopicsComponent),
      },
      {
        path: 'info/:topicId',
        loadComponent: () =>
          import('./general-info/coach-info-posts.component').then(m => m.CoachInfoPostsComponent),
      },
      {
        path: 'invite',
        loadComponent: () =>
          import('./invite-athlete/invite-athlete.component').then(m => m.InviteAthleteComponent),
      },
      {
        path: 'athlete/:athleteId',
        loadComponent: () =>
          import('./athlete-detail/athlete-detail.component').then(m => m.AthleteDetailComponent),
      },
      {
        path: 'athlete/:athleteId/plan/new',
        loadComponent: () =>
          import('./plan-editor/plan-editor.component').then(m => m.PlanEditorComponent),
      },
      {
        path: 'athlete/:athleteId/plan/:planId',
        loadComponent: () =>
          import('./plan-editor/plan-editor.component').then(m => m.PlanEditorComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
