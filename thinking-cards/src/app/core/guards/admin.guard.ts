import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.authReady;

  if (auth.isLoggedIn() && auth.isAdmin()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
