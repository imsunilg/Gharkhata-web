import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthShell } from './auth-shell';
import { API_BASE } from '../../core/config';

@Component({
  selector: 'fem-auth-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  styleUrl: './auth-forms.scss',
  template: `
    <fem-auth-shell heading="Set a new password">
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (formError()) {<p class="form-error">{{ formError() }}</p>}
        <div class="field">
          <label for="token">Reset token</label>
          <input id="token" formControlName="token" />
        </div>
        <div class="field">
          <label for="pw">New password</label>
          <input id="pw" type="password" formControlName="newPassword" autocomplete="new-password" />
          @if (show('newPassword')) {<span class="error">At least 8 characters.</span>}
        </div>
        <button class="submit" type="submit" [disabled]="busy()">Update password</button>
      </form>
      <div class="links"><a routerLink="/auth/login">Back to sign in</a></div>
    </fem-auth-shell>
  `,
})
export class ResetPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly form = this.fb.nonNullable.group({
    token: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected show(name: string) {
    const c = this.form.get(name);
    return c && c.invalid && (c.dirty || c.touched);
  }

  protected async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.formError.set('');
    try {
      await firstValueFrom(this.http.post(`${API_BASE}/auth/reset-password`, this.form.getRawValue()));
      await this.router.navigate(['/auth/login']);
    } catch (e) {
      this.formError.set((e as { userMessage?: string })?.userMessage ?? 'Could not reset the password.');
    } finally {
      this.busy.set(false);
    }
  }
}
