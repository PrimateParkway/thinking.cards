import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    data: { animation: 'home' },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    data: { animation: 'login' },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent
      ),
    data: { animation: 'register' },
  },
  {
    path: 'daily',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/daily/daily-card.component').then(
        (m) => m.DailyCardComponent
      ),
    data: { animation: 'daily' },
  },
  {
    path: 'shuffle',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/shuffle/shuffle.component').then(
        (m) => m.ShuffleComponent
      ),
    data: { animation: 'shuffle' },
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(
        (m) => m.FavoritesComponent
      ),
    data: { animation: 'favorites' },
  },
  {
    path: 'category/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/card-viewer/card-viewer.component').then(
        (m) => m.CardViewerComponent
      ),
    data: { animation: 'category' },
  },
  {
    path: 'quiz/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quiz/quiz.component').then(
        (m) => m.QuizComponent
      ),
    data: { animation: 'quiz' },
  },
  {
    path: 'badges',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/badges/badges.component').then(
        (m) => m.BadgesComponent
      ),
    data: { animation: 'badges' },
  },
  {
    path: 'themes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/themes/themes.component').then(
        (m) => m.ThemesComponent
      ),
    data: { animation: 'themes' },
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    data: { animation: 'profile' },
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    data: { animation: 'admin' },
  },
  { path: '**', redirectTo: '' },
];
