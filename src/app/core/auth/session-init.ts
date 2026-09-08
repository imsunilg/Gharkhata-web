import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * On a cold load the access token (in memory) is gone. If a refresh token is
 * stored, silently re-establish the session so F5 doesn't log the user out.
 */
export async function restoreSession(): Promise<void> {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return;
  try {
    await firstValueFrom(auth.refresh());
    await firstValueFrom(auth.loadMe());
  } catch {
    auth.logout();
  }
}
