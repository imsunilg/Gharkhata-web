import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'fem-auth-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  styleUrl: './auth-forms.scss',
  template: `
    <fem-auth-shell heading="Create your account" sub="One shared, honest view of the family's money">
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (formError()) {
          <p class="form-error" aria-live="assertive">{{ formError() }}</p>
        }
        <div class="field">
          <label for="name">Your name</label>
          <input id="name" formControlName="displayName" autocomplete="name" />
          @if (show('displayName')) {<span class="error">Enter your name.</span>}
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (show('email')) {<span class="error">Enter a valid email address.</span>}
        </div>
        <div class="field">
          <label for="password">Password</label>
          <div class="pw">
            <input
              id="password"
              [type]="reveal() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
            />
            <button type="button" (click)="reveal.set(!reveal())" aria-label="Toggle password visibility">
              {{ reveal() ? '🙈' : '👁' }}
            </button>
          </div>
          @if (show('password')) {<span class="error">At least 8 characters.</span>}
        </div>
        <button class="submit" type="submit" [disabled]="busy()">
          {{ busy() ? 'Creating…' : 'Create account' }}
        </button>
      </form>
      <div class="links"><a routerLink="/auth/login">I already have an account</a></div>
    </fem-auth-shell>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly reveal = signal(false);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
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
      const { email, password, displayName } = this.form.getRawValue();
      await firstValueFrom(this.auth.register(email, password, displayName));
      await firstValueFrom(this.auth.loadMe());
      await this.router.navigate(['/auth/create-family']);
    } catch (e) {
      this.formError.set((e as { userMessage?: string })?.userMessage ?? 'Registration failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
