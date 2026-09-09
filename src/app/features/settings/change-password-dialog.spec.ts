import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NEVER, of, throwError } from 'rxjs';
import { ChangePasswordDialog } from './change-password-dialog';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const auth = TestBed.inject(AuthService);
  const toast = TestBed.inject(ToastService);
  const fixture = TestBed.createComponent(ChangePasswordDialog);
  const closed = vi.fn();
  fixture.componentInstance.closed.subscribe(closed);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  const form = () => (fixture.componentInstance as unknown as { form: import('@angular/forms').FormGroup }).form;
  const fill = (current: string, next: string, confirm: string) => {
    form().setValue({ currentPassword: current, newPassword: next, confirmPassword: confirm });
    fixture.detectChanges();
  };
  const submit = () => {
    (fixture.componentInstance as unknown as { submit: () => Promise<void> }).submit();
    fixture.detectChanges();
  };
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
    fixture.detectChanges();
  };
  return { fixture, auth, toast, el, form, fill, submit, flush, closed };
}

describe('ChangePasswordDialog', () => {
  it('does not call the API when the form is invalid', () => {
    const { auth, fill, submit } = setup();
    const spy = vi.spyOn(auth, 'changePassword');
    fill('', 'short', 'nomatch');
    submit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('flags a confirmation mismatch and blocks submit', () => {
    const { auth, el, fill, submit } = setup();
    const spy = vi.spyOn(auth, 'changePassword');
    fill('current123', 'newpassword1', 'newpassword2');
    submit();
    expect(el.textContent).toContain('do not match');
    expect(spy).not.toHaveBeenCalled();
  });

  it('flags a new password identical to the current one', () => {
    const { el, fill, submit } = setup();
    fill('samepass123', 'samepass123', 'samepass123');
    submit();
    expect(el.textContent).toContain('different from your current one');
  });

  it('on success: calls the API, toasts, resets and closes', async () => {
    const { auth, toast, form, fill, submit, flush, closed } = setup();
    const api = vi.spyOn(auth, 'changePassword').mockReturnValue(of(undefined));
    const okToast = vi.spyOn(toast, 'success');
    fill('current123', 'newpassword1', 'newpassword1');
    submit();
    await flush();
    expect(api).toHaveBeenCalledWith('current123', 'newpassword1', 'newpassword1');
    expect(okToast).toHaveBeenCalled();
    expect(closed).toHaveBeenCalled();
    expect(form().getRawValue().newPassword).toBe('');
  });

  it('on failure: stays open and shows the backend message', async () => {
    const { auth, el, fill, submit, flush, closed } = setup();
    vi.spyOn(auth, 'changePassword').mockReturnValue(
      throwError(() => ({ status: 400, userMessage: 'Your current password is incorrect.' })),
    );
    fill('wrongpass123', 'newpassword1', 'newpassword1');
    submit();
    await flush();
    expect(el.textContent).toContain('Your current password is incorrect.');
    expect(closed).not.toHaveBeenCalled();
  });

  it('ignores a second submit while a request is in flight', async () => {
    const { auth, fill, submit, flush } = setup();
    const api = vi.spyOn(auth, 'changePassword').mockReturnValue(NEVER);
    fill('current123', 'newpassword1', 'newpassword1');
    submit();
    submit();
    await flush();
    expect(api).toHaveBeenCalledTimes(1);
  });
});
