import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { familyGuard, platformAdminGuard } from './guards';
import { AuthService } from './auth.service';
import type { MeResponse } from '../api/models';

async function run(guard: typeof platformAdminGuard): Promise<boolean | UrlTree> {
  return (await TestBed.runInInjectionContext(() => guard({} as never, {} as never))) as boolean | UrlTree;
}

function setup(me: Partial<MeResponse> | null, token: string | null = 'tok') {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const auth = TestBed.inject(AuthService);
  if (token) auth.setAccessToken(token);
  // Pre-seed the user signal so the guards' ensureUser() short-circuits.
  (auth as unknown as { _user: { set: (v: unknown) => void } })._user.set(me);
  return { auth, router: TestBed.inject(Router) };
}

const path = (r: boolean | UrlTree) => (r === true ? '(allow)' : (r as UrlTree).toString());

describe('platformAdminGuard', () => {
  it('allows a super admin', async () => {
    setup({ platformRole: 'SuperAdmin' });
    expect(await run(platformAdminGuard)).toBe(true);
  });

  it('redirects a normal user to the dashboard', async () => {
    setup({ platformRole: null, familyId: 'f1' });
    expect(path(await run(platformAdminGuard))).toBe('/dashboard');
  });

  it('redirects an anonymous visitor to login', async () => {
    setup(null, null);
    expect(path(await run(platformAdminGuard))).toBe('/auth/login');
  });
});

describe('familyGuard', () => {
  it('sends a family-less super admin to /admin, not onboarding', async () => {
    setup({ platformRole: 'SuperAdmin', familyId: null });
    expect(path(await run(familyGuard))).toBe('/admin');
  });

  it('sends a family-less normal user to create-family', async () => {
    setup({ platformRole: null, familyId: null });
    expect(path(await run(familyGuard))).toBe('/auth/create-family');
  });

  it('lets a user with a family through', async () => {
    setup({ familyId: 'f1' });
    expect(await run(familyGuard)).toBe(true);
  });
});
