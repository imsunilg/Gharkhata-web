import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminUsersPage } from './admin-users';
import { AdminApiService } from './admin-api.service';
import type { AdminUserListItemPagedResult } from '../../core/api/models';

const pageResponse: AdminUserListItemPagedResult = {
  items: [
    { id: 'u1', displayName: 'Alice', email: 'alice@t.com', familyRole: 'Owner', familyName: 'Fam A', status: 'Active', isDeleted: false, createdAt: '2026-09-01T00:00:00Z', lastLoginAt: '2026-09-08T00:00:00Z' },
    { id: 'u2', displayName: 'Bob', email: 'bob@t.com', platformRole: 'SuperAdmin', status: 'Suspended', isDeleted: false, createdAt: '2026-08-01T00:00:00Z', lastLoginAt: null },
  ],
  page: 1, pageSize: 25, totalCount: 2, totalPages: 1,
};

async function setup(rows = pageResponse) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const api = TestBed.inject(AdminApiService);
  vi.spyOn(api, 'families').mockReturnValue(of([{ id: 'f1', name: 'Fam A', memberCount: 2 }]));
  const usersSpy = vi.spyOn(api, 'users').mockReturnValue(of(rows));
  const router = TestBed.inject(Router);
  const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdminUsersPage);
  fixture.detectChanges();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  fixture.detectChanges();
  return { fixture, api, usersSpy, nav, el: fixture.nativeElement as HTMLElement };
}

describe('AdminUsersPage', () => {
  beforeEach(() => vi.useRealTimers());

  it('renders a row per user with role and status badges', async () => {
    const { el } = await setup();
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(el.textContent).toContain('Alice');
    expect(el.textContent).toContain('SuperAdmin');
    expect(el.querySelector('.badge.status.s-Suspended')).toBeTruthy();
  });

  it('debounces the search box then navigates with a query param', async () => {
    vi.useFakeTimers();
    const { el, nav } = await setup();
    const search = el.querySelector('input.search') as HTMLInputElement;
    search.value = 'ali';
    search.dispatchEvent(new Event('input'));
    expect(nav).not.toHaveBeenCalled();
    vi.advanceTimersByTime(350);
    expect(nav).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ search: 'ali', page: 1 }),
    }));
    vi.useRealTimers();
  });

  it('changing a filter resets to page 1', async () => {
    const { fixture, nav } = await setup();
    (fixture.componentInstance as unknown as { applyFilter: (p: object) => void }).applyFilter({ status: 'Deleted' });
    expect(nav).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ status: 'Deleted', page: 1 }),
    }));
  });

  it('opens the create-user dialog', async () => {
    const { el, fixture } = await setup();
    (el.querySelector('button.create') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('fem-admin-user-form-dialog')).toBeTruthy();
  });

  it('a deleted user only offers Restore', async () => {
    const { el, fixture } = await setup({
      ...pageResponse,
      items: [{ id: 'u3', displayName: 'Gone', email: 'g@t.com', status: 'Inactive', isDeleted: true, createdAt: '2026-01-01T00:00:00Z', lastLoginAt: null }],
    });
    (el.querySelector('.kebab') as HTMLButtonElement).click();
    fixture.detectChanges();
    const items = [...el.querySelectorAll('.menu [role="menuitem"]')].map((n) => n.textContent?.trim());
    expect(items).toContain('Restore');
    expect(items).not.toContain('Delete');
  });
});
