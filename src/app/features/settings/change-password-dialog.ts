import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** Mirror of the server policy (RegisterRequestValidator / ChangePasswordRequestValidator). */
const MIN_LENGTH = 8;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return next && confirm && next !== confirm ? { mismatch: true } : null;
}

function differsFromCurrent(group: AbstractControl): ValidationErrors | null {
  const current = group.get('currentPassword')?.value;
  const next = group.get('newPassword')?.value;
  return current && next && current === next ? { sameAsCurrent: true } : null;
}

@Component({
  selector: 'fem-change-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <button type="button" class="scrim" aria-label="Close dialog" (click)="cancel()"></button>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cp-title"
      tabindex="-1"
      (keydown.escape)="cancel()"
    >
      <h3 id="cp-title">Change password</h3>

      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (formError()) {
          <p class="form-error" aria-live="assertive">{{ formError() }}</p>
        }

        <div class="field">
          <label for="cp-current">Current password</label>
          <div class="pw">
            <input
              #first
              id="cp-current"
              [type]="reveal().current ? 'text' : 'password'"
              formControlName="currentPassword"
              autocomplete="current-password"
            />
            <button
              type="button"
              (click)="toggle('current')"
              [attr.aria-label]="reveal().current ? 'Hide current password' : 'Show current password'"
            >
              {{ reveal().current ? '🙈' : '👁' }}
            </button>
          </div>
          @if (touched('currentPassword') && form.get('currentPassword')?.hasError('required')) {
            <span class="error">Enter your current password.</span>
          }
        </div>

        <div class="field">
          <label for="cp-new">New password</label>
          <div class="pw">
            <input
              id="cp-new"
              [type]="reveal().next ? 'text' : 'password'"
              formControlName="newPassword"
              autocomplete="new-password"
            />
            <button
              type="button"
              (click)="toggle('next')"
              [attr.aria-label]="reveal().next ? 'Hide new password' : 'Show new password'"
            >
              {{ reveal().next ? '🙈' : '👁' }}
            </button>
          </div>
          @if (touched('newPassword')) {
            @if (form.get('newPassword')?.hasError('required')) {
              <span class="error">Enter a new password.</span>
            } @else if (form.get('newPassword')?.hasError('minlength')) {
              <span class="error">Use at least {{ MIN_LENGTH }} characters.</span>
            } @else if (form.hasError('sameAsCurrent')) {
              <span class="error">Choose a password different from your current one.</span>
            }
          }
        </div>

        <div class="field">
          <label for="cp-confirm">Confirm new password</label>
          <div class="pw">
            <input
              id="cp-confirm"
              [type]="reveal().confirm ? 'text' : 'password'"
              formControlName="confirmPassword"
              autocomplete="new-password"
            />
            <button
              type="button"
              (click)="toggle('confirm')"
              [attr.aria-label]="reveal().confirm ? 'Hide confirmation' : 'Show confirmation'"
            >
              {{ reveal().confirm ? '🙈' : '👁' }}
            </button>
          </div>
          @if (touched('confirmPassword')) {
            @if (form.get('confirmPassword')?.hasError('required')) {
              <span class="error">Re-enter the new password.</span>
            } @else if (form.hasError('mismatch')) {
              <span class="error">The passwords do not match.</span>
            }
          }
        </div>

        <div class="actions">
          <button type="button" class="ghost" (click)="cancel()" [disabled]="busy()">Cancel</button>
          <button type="submit" class="primary" [disabled]="busy()">
            {{ busy() ? 'Changing…' : 'Change password' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 16px;
      }
      .scrim {
        position: absolute;
        inset: 0;
        border: none;
        padding: 0;
        background: rgba(0, 0, 0, 0.55);
        cursor: default;
      }
      .dialog {
        position: relative;
        width: 100%;
        max-width: 380px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sheet);
        padding: 20px;
      }
      h3 {
        margin: 0 0 14px;
        font-size: 1.05rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
      input {
        height: 44px;
        width: 100%;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface-raised);
        color: var(--text-primary);
        padding: 0 44px 0 12px;
        font-size: 0.95rem;
      }
      input:focus {
        border-color: var(--accent);
        outline: none;
      }
      .pw {
        position: relative;
      }
      .pw button {
        position: absolute;
        right: 4px;
        top: 4px;
        height: 36px;
        width: 36px;
        border: none;
        background: none;
        color: var(--text-tertiary);
        cursor: pointer;
      }
      .error {
        color: var(--negative);
        font-size: 0.78rem;
      }
      .form-error {
        margin: 0;
        background: rgba(226, 105, 75, 0.12);
        border: 1px solid var(--negative);
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 0.82rem;
        color: var(--text-primary);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 6px;
      }
      .actions button {
        height: 40px;
        padding: 0 16px;
        border-radius: 8px;
        font: inherit;
        font-size: 0.88rem;
        cursor: pointer;
      }
      .actions button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .ghost {
        border: 1px solid var(--border);
        background: none;
        color: var(--text-secondary);
      }
      .primary {
        border: none;
        background: var(--accent);
        color: #14161c;
        font-weight: 600;
      }
    `,
  ],
})
export class ChangePasswordDialog implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly closed = output<void>();

  protected readonly MIN_LENGTH = MIN_LENGTH;
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly reveal = signal({ current: false, next: false, confirm: false });

  private readonly first = viewChild<ElementRef<HTMLInputElement>>('first');

  protected readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(MIN_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatch, differsFromCurrent] },
  );

  ngAfterViewInit(): void {
    queueMicrotask(() => this.first()?.nativeElement.focus());
  }

  protected toggle(which: 'current' | 'next' | 'confirm'): void {
    this.reveal.update((r) => ({ ...r, [which]: !r[which] }));
  }

  protected touched(name: string): boolean {
    const c = this.form.get(name);
    return !!c && (c.dirty || c.touched);
  }

  protected cancel(): void {
    if (this.busy()) return;
    this.closed.emit();
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return; // guard against rapid double-submit
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.formError.set('');
    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    try {
      await firstValueFrom(this.auth.changePassword(currentPassword, newPassword, confirmPassword));
      this.form.reset();
      this.toast.success('Password changed.');
      this.closed.emit();
    } catch (e) {
      this.formError.set(this.messageFor(e));
    } finally {
      this.busy.set(false);
    }
  }

  private messageFor(e: unknown): string {
    const err = e as (HttpErrorResponse & { userMessage?: string }) | undefined;
    if (err?.status === 401) return 'Your session has expired. Please sign in again.';
    if (err?.status === 429) return 'Too many attempts. Wait a minute and try again.';
    if (err?.status === 0) return 'Cannot reach the server. Check your connection and try again.';
    return err?.userMessage || 'Could not change your password. Please try again.';
  }
}
