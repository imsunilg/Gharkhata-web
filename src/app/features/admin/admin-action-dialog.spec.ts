import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AdminActionDialog, UserAction } from './admin-action-dialog';
import { AdminApiService } from './admin-api.service';
import { ToastService } from '../../core/services/toast.service';
import type { AdminUserListItem } from '../../core/api/models';

const user: AdminUserListItem = {
  id: 'u1', displayName: 'Jane Doe', email: 'jane@t.com', status: 'Active', isDeleted: false,
};

function setup(action: UserAction) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const api = TestBed.inject(AdminApiService);
  const toast = TestBed.inject(ToastService);
  const fixture = TestBed.createComponent(AdminActionDialog);
  fixture.componentRef.setInput('user', user);
  fixture.componentRef.setInput('action', action);
  const done = vi.fn();
  const closed = vi.fn();
  fixture.componentInstance.done.subscribe(done);
  fixture.componentInstance.closed.subscribe(closed);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const confirmBtn = () => [...el.querySelectorAll('button')].find((b) => /Activate|Deactivate|Suspend|Restore|Delete|reset link|Working/i.test(b.textContent ?? ''))!;
  const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); fixture.detectChanges(); };
  return { fixture, api, toast, el, confirmBtn, done, closed, flush };
}

describe('AdminActionDialog', () => {
  it('deactivate: calls the API, toasts, emits done + closed', async () => {
    const { api, toast, confirmBtn, done, closed, flush } = setup('deactivate');
    const spy = vi.spyOn(api, 'deactivate').mockReturnValue(of({}) as never);
    const ok = vi.spyOn(toast, 'success');
    confirmBtn().click();
    await flush();
    expect(spy).toHaveBeenCalledWith('u1');
    expect(ok).toHaveBeenCalled();
    expect(done).toHaveBeenCalled();
    expect(closed).toHaveBeenCalled();
  });

  it('suspend: sends the typed reason', async () => {
    const { fixture, api, el, confirmBtn, flush } = setup('suspend');
    const spy = vi.spyOn(api, 'suspend').mockReturnValue(of({}) as never);
    const ta = el.querySelector('textarea')!;
    ta.value = 'policy violation';
    ta.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    confirmBtn().click();
    await flush();
    expect(spy).toHaveBeenCalledWith('u1', 'policy violation');
  });

  it('failure: keeps the dialog open and shows the backend message', async () => {
    const { api, el, confirmBtn, closed, flush } = setup('delete');
    vi.spyOn(api, 'deleteUser').mockReturnValue(
      throwError(() => ({ status: 400, userMessage: 'This is the last active super admin and cannot be removed.' })),
    );
    confirmBtn().click();
    await flush();
    expect(el.textContent).toContain('last active super admin');
    expect(closed).not.toHaveBeenCalled();
  });

  it('delete: uses danger styling and strong copy', () => {
    const { el } = setup('delete');
    expect(el.textContent).toContain('marks it as deleted');
    expect(el.querySelector('button.danger')).toBeTruthy();
  });
});
