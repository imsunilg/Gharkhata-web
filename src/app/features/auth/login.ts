import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'fem-auth-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  styleUrl: './auth-forms.scss',
  template: `
    <fem-auth-shell heading="Welcome back" sub="Sign in to your family ledger">
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (formError()) {
          <p class="form-error" aria-live="assertive">{{ formError() }}</p>
        }
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (show('email')) {
            <span class="error">Enter a valid email address.</span>
          }
        </div>
        <div class="field">
          <label for="password">Password</label>
          <div class="pw">
            <input
              id="password"
              [type]="reveal() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button type="button" (click)="reveal.set(!reveal())" [attr.aria-label]="reveal() ? 'Hide' : 'Reveal'">
              {{ reveal() ? '🙈' : '👁' }}
            </button>
          </div>
        </div>
        <button class="submit" type="submit" [disabled]="busy()">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <div class="links">
        <a routerLink="/auth/register">Create an account</a>
        <a routerLink="/auth/forgot-password">Forgot password?</a>
      </div>
    </fem-auth-shell>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly reveal = signal(false);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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
      const { email, password } = this.form.getRawValue();
      await firstValueFrom(this.auth.login(email, password));
      const me = await firstValueFrom(this.auth.loadMe());
      await this.router.navigate([me.familyId ? '/dashboard' : '/auth/create-family']);
    } catch (e) {
      this.formError.set((e as { userMessage?: string })?.userMessage ?? 'Sign in failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
