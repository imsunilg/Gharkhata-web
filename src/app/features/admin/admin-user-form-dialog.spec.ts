import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AdminUserFormDialog } from './admin-user-form-dialog';
import { AdminApiService } from './admin-api.service';
import type { AdminFamilyListItem, AdminUserListItem } from '../../core/api/models';

const families: AdminFamilyListItem[] = [{ id: 'f1', name: 'The Sharmas', memberCount: 3 }];

function setup(user?: AdminUserListItem) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const api = TestBed.inject(AdminApiService);
  const fixture = TestBed.createComponent(AdminUserFormDialog);
  if (user) fixture.componentRef.setInput('user', user);
  fixture.componentRef.setInput('families', families);
  const done = vi.fn();
  fixture.componentInstance.done.subscribe(done);
  fixture.detectChanges();
  const form = () => (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
  const submit = () => {
    (fixture.componentInstance as unknown as { submit: () => Promise<void> }).submit();
    fixture.detectChanges();
  };
  const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); fixture.detectChanges(); };
  return { fixture, api, done, form, submit, flush };
}

describe('AdminUserFormDialog — create', () => {
  it('blocks a weak password / mismatch / missing family', async () => {
    const { api, form, submit } = setup();
    const spy = vi.spyOn(api, 'createUser');
    form().patchValue({ displayName: 'A', email: 'a@t.com', password: 'short', confirmPassword: 'nope', role: 'Member', familyId: '' });
    submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('requires the SuperAdmin confirmation checkbox', async () => {
    const { api, form, submit } = setup();
    const spy = vi.spyOn(api, 'createUser');
    form().patchValue({
      displayName: 'Root', email: 'root@t.com', password: 'password123', confirmPassword: 'password123',
      role: 'SuperAdmin', confirmSuperAdmin: false,
    });
    submit();
    expect(spy).not.toHaveBeenCalled();
    form().patchValue({ confirmSuperAdmin: true });
    submit();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toMatchObject({ role: 'SuperAdmin', confirmSuperAdmin: true, familyId: null });
  });

  it('creates a family member with the chosen family', async () => {
    const { api, form, submit, done, flush } = setup();
    const spy = vi.spyOn(api, 'createUser').mockReturnValue(of({}) as never);
    form().patchValue({
      displayName: 'Meera', email: 'meera@t.com', password: 'password123', confirmPassword: 'password123',
      role: 'Member', familyId: 'f1', status: 'Active',
    });
    submit();
    await flush();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ email: 'meera@t.com', familyId: 'f1', role: 'Member' }));
    expect(done).toHaveBeenCalled();
  });
});

describe('AdminUserFormDialog — edit', () => {
  it('prefills, hides the password fields and calls updateUser', async () => {
    const user: AdminUserListItem = { id: 'u9', displayName: 'Old Name', email: 'old@t.com', status: 'Active', isDeleted: false };
    const { fixture, api, form, submit, flush } = setup(user);
    await flush();
    expect((fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]')).toBeNull();
    expect(form().getRawValue().displayName).toBe('Old Name');
    const spy = vi.spyOn(api, 'updateUser').mockReturnValue(of({}) as never);
    form().patchValue({ displayName: 'New Name' });
    submit();
    await flush();
    expect(spy).toHaveBeenCalledWith('u9', expect.objectContaining({ displayName: 'New Name', email: 'old@t.com' }));
  });
});
