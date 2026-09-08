import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthShell } from './auth-shell';
import { API_BASE } from '../../core/config';

@Component({
  selector: 'fem-auth-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  styleUrl: './auth-forms.scss',
  template: `
    <fem-auth-shell heading="Reset your password" sub="We'll send a reset link to your email">
      @if (sent()) {
        <p>If an account exists for that email, a reset link is on its way. Check the API console in local mode.</p>
        <div class="links"><a routerLink="/auth/reset-password">I have a token</a></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" />
          </div>
          <button class="submit" type="submit" [disabled]="busy()">Send reset link</button>
        </form>
        <div class="links"><a routerLink="/auth/login">Back to sign in</a></div>
      }
    </fem-auth-shell>
  `,
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async submit() {
    if (this.form.invalid) return;
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.http.post(`${API_BASE}/auth/forgot-password`, this.form.getRawValue()),
      );
    } catch {
      /* do not reveal */
    } finally {
      this.busy.set(false);
      this.sent.set(true);
    }
  }
}
