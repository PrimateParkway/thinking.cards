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
