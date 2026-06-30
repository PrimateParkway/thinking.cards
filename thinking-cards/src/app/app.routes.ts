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
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
    data: { animation: 'landing' },
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
    path: 'quizzes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quizzes/quizzes.component').then(
        (m) => m.QuizzesComponent
      ),
    data: { animation: 'quizzes' },
  },
  {
    path: 'puzzles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/puzzles/puzzles.component').then(
        (m) => m.PuzzlesComponent
      ),
    data: { animation: 'puzzles' },
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
    path: 'matrix/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/matrix/matrix.component').then(
        (m) => m.MatrixComponent
      ),
    data: { animation: 'matrix' },
  },
  {
    path: 'cryptogram/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cryptogram/cryptogram.component').then(
        (m) => m.CryptogramComponent
      ),
    data: { animation: 'cryptogram' },
  },
  {
    path: 'nonogram/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/nonogram/nonogram.component').then(
        (m) => m.NonogramComponent
      ),
    data: { animation: 'nonogram' },
  },
  {
    path: 'codebreaker/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/codebreaker/codebreaker.component').then(
        (m) => m.CodebreakerComponent
      ),
    data: { animation: 'codebreaker' },
  },
  {
    path: 'knights/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/knights/knights.component').then(
        (m) => m.KnightsComponent
      ),
    data: { animation: 'knights' },
  },
  {
    path: 'escape/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/escape/escape.component').then(
        (m) => m.EscapeComponent
      ),
    data: { animation: 'escape' },
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
    path: 'notebook',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notebook/notebook.component').then(
        (m) => m.NotebookComponent
      ),
    data: { animation: 'notebook' },
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
