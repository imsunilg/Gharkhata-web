import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Modal } from '../../shared/components/modal';
import { ToastService } from '../../core/services/toast.service';
import { AdminApiService } from './admin-api.service';
import type { AdminUserListItem } from '../../core/api/models';

export type UserAction = 'activate' | 'deactivate' | 'suspend' | 'restore' | 'delete' | 'reset-password';

interface Copy {
  title: string;
  body: string;
  confirm: string;
  danger?: boolean;
}

@Component({
  selector: 'fem-admin-action-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Modal],
  template: `
    <fem-modal [title]="copy().title" (closed)="cancel()">
      @if (formError()) {
        <p class="form-error" aria-live="assertive">{{ formError() }}</p>
      }
      <p class="msg">{{ copy().body }}</p>
      <p class="who"><strong>{{ user().displayName }}</strong> · {{ user().email }}</p>

      @if (action() === 'suspend') {
        <label class="field">
          <span>Reason (optional)</span>
          <textarea [(ngModel)]="reason" rows="3" maxlength="500"></textarea>
        </label>
      }

      <div modalActions>
        <button type="button" class="ghost" (click)="cancel()" [disabled]="busy()">Cancel</button>
        <button
          type="button"
          [class]="copy().danger ? 'danger' : 'primary'"
          (click)="confirm()"
          [disabled]="busy()"
        >
          {{ busy() ? 'Working…' : copy().confirm }}
        </button>
      </div>
    </fem-modal>
  `,
  styles: [
    `
      .msg { margin: 0; font-size: 0.9rem; }
      .who { margin: 0; font-size: 0.82rem; color: var(--text-secondary); }
      .field { display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: var(--text-secondary); }
      textarea {
        border-radius: 10px; border: 1px solid var(--border);
        background: var(--surface-raised); color: var(--text-primary);
        padding: 8px 10px; font: inherit; font-size: 0.9rem; resize: vertical;
      }
      .form-error {
        margin: 0; background: rgba(226, 105, 75, 0.12); border: 1px solid var(--negative);
        border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; color: var(--text-primary);
      }
      [modalActions] button {
        height: 40px; padding: 0 16px; border-radius: 8px; font: inherit; font-size: 0.88rem; cursor: pointer;
      }
      [modalActions] button:disabled { opacity: 0.6; cursor: default; }
      .ghost { border: 1px solid var(--border); background: none; color: var(--text-secondary); }
      .primary { border: none; background: var(--accent); color: #14161c; font-weight: 600; }
      .danger { border: none; background: var(--negative); color: #14161c; font-weight: 600; }
    `,
  ],
})
export class AdminActionDialog {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  readonly user = input.required<AdminUserListItem>();
  readonly action = input.required<UserAction>();
  readonly done = output<void>();
  readonly closed = output<void>();

  private readonly modal = viewChild(Modal);

  protected reason = '';
  protected readonly busy = signal(false);
  protected readonly formError = signal('');

  protected readonly copy = computed<Copy>(() => {
    switch (this.action()) {
      case 'activate':
        return { title: 'Activate user', body: 'Are you sure you want to activate this user? They will be able to sign in again.', confirm: 'Activate' };
      case 'deactivate':
        return { title: 'Deactivate user', body: 'Are you sure you want to deactivate this user? They will be signed out and cannot sign in until reactivated.', confirm: 'Deactivate', danger: true };
      case 'suspend':
        return { title: 'Suspend user', body: 'The user will be signed out and blocked from signing in while suspended.', confirm: 'Suspend', danger: true };
      case 'restore':
        return { title: 'Restore user', body: 'Restore this deleted account and set it back to Active?', confirm: 'Restore' };
      case 'reset-password':
        return { title: 'Reset password', body: 'Send this user a password-reset link. Their current password keeps working until they use it.', confirm: 'Send reset link' };
      case 'delete':
        return { title: 'Delete user?', body: 'This deactivates the account and marks it as deleted. Financial records are kept and the account can be restored later.', confirm: 'Delete user', danger: true };
    }
  });

  protected cancel(): void {
    if (!this.busy()) this.closed.emit();
  }

  protected async confirm(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    const m = this.modal();
    if (m) m.busy = true;
    this.formError.set('');
    const id = this.user().id!;
    try {
      switch (this.action()) {
        case 'activate': await firstValueFrom(this.api.activate(id)); break;
        case 'deactivate': await firstValueFrom(this.api.deactivate(id)); break;
        case 'suspend': await firstValueFrom(this.api.suspend(id, this.reason.trim() || null)); break;
        case 'restore': await firstValueFrom(this.api.restore(id)); break;
        case 'delete': await firstValueFrom(this.api.deleteUser(id)); break;
        case 'reset-password': await firstValueFrom(this.api.resetPassword(id)); break;
      }
      this.toast.success(this.successText());
      this.done.emit();
      this.closed.emit();
    } catch (e) {
      this.formError.set(messageFor(e));
    } finally {
      this.busy.set(false);
      if (m) m.busy = false;
    }
  }

  private successText(): string {
    switch (this.action()) {
      case 'activate': return 'User activated.';
      case 'deactivate': return 'User deactivated.';
      case 'suspend': return 'User suspended.';
      case 'restore': return 'User restored.';
      case 'delete': return 'User deleted.';
      case 'reset-password': return 'Password-reset link sent.';
    }
  }
}

export function messageFor(e: unknown): string {
  const err = e as (HttpErrorResponse & { userMessage?: string }) | undefined;
  if (err?.status === 401) return 'Your session has expired. Please sign in again.';
  if (err?.status === 403) return 'You do not have permission to do that.';
  if (err?.status === 404) return 'That user no longer exists.';
  if (err?.status === 429) return 'Too many requests. Wait a minute and try again.';
  if (err?.status === 0) return 'Cannot reach the server. Check your connection.';
  return err?.userMessage || 'Something went wrong. Please try again.';
}
