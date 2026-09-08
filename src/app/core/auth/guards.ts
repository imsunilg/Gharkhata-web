import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

async function ensureUser(auth: AuthService): Promise<void> {
  if (!auth.user() && auth.isAuthenticated()) {
    try {
      await firstValueFrom(auth.loadMe());
    } catch {
      /* handled by interceptor */
    }
  }
}

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  await ensureUser(auth);
  return true;
};

export const familyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  await ensureUser(auth);
  return auth.hasFamily() ? true : router.createUrlTree(['/auth/create-family']);
};

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.user()?.role;
    return role && roles.includes(role) ? true : router.createUrlTree(['/dashboard']);
  };
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
