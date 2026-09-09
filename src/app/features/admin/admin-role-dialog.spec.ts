import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminRoleDialog } from './admin-role-dialog';
import { AdminApiService } from './admin-api.service';
import type { AdminUserListItem } from '../../core/api/models';

function setup(user: AdminUserListItem) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const api = TestBed.inject(AdminApiService);
  const fixture = TestBed.createComponent(AdminRoleDialog);
  fixture.componentRef.setInput('user', user);
  fixture.componentRef.setInput('families', [{ id: 'f1', name: 'Fam', memberCount: 1 }]);
  const done = vi.fn();
  fixture.componentInstance.done.subscribe(done);
  fixture.detectChanges();
  const ci = fixture.componentInstance as unknown as {
    role: { set: (r: string) => void };
    confirmSuper: { set: (v: boolean) => void };
    save: () => Promise<void>;
    valid: () => boolean;
  };
  const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); fixture.detectChanges(); };
  return { fixture, api, ci, done, flush, el: fixture.nativeElement as HTMLElement };
}

const owner: AdminUserListItem = {
  id: 'u1', displayName: 'Ravi', email: 'ravi@t.com', familyRole: 'Owner', familyId: 'f1', status: 'Active', isDeleted: false,
};

describe('AdminRoleDialog', () => {
  it('shows the current role and a live "new" preview', async () => {
    const { el, ci, fixture } = setup(owner);
    await Promise.resolve();
    fixture.detectChanges();
    expect(el.textContent).toContain('Current: Owner');
    ci.role.set('Admin');
    fixture.detectChanges();
    expect(el.textContent).toContain('New: Admin');
  });

  it('requires the confirmation checkbox to grant SuperAdmin', async () => {
    const { api, ci, fixture } = setup(owner);
    const spy = vi.spyOn(api, 'changeRole').mockReturnValue(of({}) as never);
    ci.role.set('SuperAdmin');
    fixture.detectChanges();
    expect(ci.valid()).toBe(false);
    ci.confirmSuper.set(true);
    fixture.detectChanges();
    expect(ci.valid()).toBe(true);
    await ci.save();
    expect(spy).toHaveBeenCalledWith('u1', expect.objectContaining({ role: 'SuperAdmin', confirmSuperAdmin: true }));
  });

  it('changes to a family role via the API', async () => {
    const { api, ci, done, flush } = setup(owner);
    const spy = vi.spyOn(api, 'changeRole').mockReturnValue(of({}) as never);
    ci.role.set('Member');
    await ci.save();
    await flush();
    expect(spy).toHaveBeenCalledWith('u1', expect.objectContaining({ role: 'Member' }));
    expect(done).toHaveBeenCalled();
  });
});
