import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminUserDetailPage } from './admin-user-detail';
import { AdminApiService } from './admin-api.service';
import type { AdminUserDetail } from '../../core/api/models';

const detail: AdminUserDetail = {
  id: 'u1', displayName: 'Ravi Kumar', email: 'ravi@t.com', platformRole: null, status: 'Active',
  isDeleted: false, createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-05T10:00:00Z',
  lastLoginAt: '2026-09-08T09:00:00Z', emailVerifiedAt: '2026-09-01T10:00:00Z',
  familyId: 'f1', familyName: 'The Sharmas', familyRole: 'Owner',
  recentActivity: [
    { id: 'a1', timestamp: '2026-09-05T10:00:00Z', action: 'ROLE_CHANGED', actorEmail: 'demo@gharkhata.com', oldValue: 'Member', newValue: 'Owner' },
  ],
};

function setup(user = detail) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => user.id }) } },
    ],
  });
  const api = TestBed.inject(AdminApiService);
  vi.spyOn(api, 'families').mockReturnValue(of([{ id: 'f1', name: 'The Sharmas', memberCount: 3 }]));
  vi.spyOn(api, 'user').mockReturnValue(of(user));
  const fixture = TestBed.createComponent(AdminUserDetailPage);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('AdminUserDetailPage', () => {
  it('renders the profile / account / family / activity sections', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.textContent).toContain('Ravi Kumar');
    expect(el.textContent).toContain('ravi@t.com');
    expect(el.textContent).toContain('The Sharmas');
    expect(el.textContent).toContain('ROLE_CHANGED');
    expect(el.textContent).toContain('Member → Owner');
    // never renders a password or hash
    expect(el.textContent).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('offers lifecycle actions for an active user', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    const actions = [...el.querySelectorAll('.actions button')].map((b) => b.textContent?.trim());
    expect(actions).toEqual(expect.arrayContaining(['Edit', 'Change role', 'Deactivate', 'Suspend', 'Delete']));
  });

  it('a deleted user only offers Restore', async () => {
    const { fixture, el } = setup({ ...detail, isDeleted: true, status: 'Inactive', deletedAt: '2026-09-06T00:00:00Z' });
    await fixture.whenStable();
    fixture.detectChanges();
    const actions = [...el.querySelectorAll('.actions button')].map((b) => b.textContent?.trim());
    expect(actions).toEqual(['Restore']);
  });

  it('opens the change-role dialog', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    fixture.detectChanges();
    [...el.querySelectorAll('.actions button')].find((b) => b.textContent?.includes('Change role'))!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('fem-admin-role-dialog')).toBeTruthy();
  });
});
