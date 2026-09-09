import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Modal } from '../../shared/components/modal';
import { ToastService } from '../../core/services/toast.service';
import { AdminApiService } from './admin-api.service';
import { messageFor } from './admin-action-dialog';
import type { AdminFamilyListItem, AdminUserListItem, AssignableRole } from '../../core/api/models';

const ROLES: AssignableRole[] = ['Member', 'Admin', 'Owner', 'SuperAdmin'];

@Component({
  selector: 'fem-admin-role-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Modal],
  template: `
    <fem-modal title="Change role" (closed)="cancel()">
      @if (formError()) {
        <p class="form-error" aria-live="assertive">{{ formError() }}</p>
      }
      <p class="who"><strong>{{ user().displayName }}</strong> · {{ user().email }}</p>

      <div class="rolerow">
        <span class="pill">Current: {{ currentRole() }}</span>
        <span aria-hidden="true">→</span>
        <span class="pill new">New: {{ role() }}</span>
      </div>

      <label class="field">
        <span>New role</span>
        <select [ngModel]="role()" (ngModelChange)="role.set($event)">
          @for (r of roles; track r) {
            <option [value]="r">{{ r }}</option>
          }
        </select>
      </label>

      @if (needsFamily()) {
        <label class="field">
          <span>Family</span>
          <select [ngModel]="familyId()" (ngModelChange)="familyId.set($event)">
            <option value="">Select a family…</option>
            @for (f of families(); track f.id) {
              <option [value]="f.id">{{ f.name }}</option>
            }
          </select>
        </label>
      }

      <label class="field">
        <span>Reason (optional)</span>
        <input [(ngModel)]="reason" maxlength="500" />
      </label>

      @if (role() === 'SuperAdmin') {
        <p class="warn">
          Super Admins have full control over every user and family. Only grant this to people who
          need platform-wide administrative access.
        </p>
        <label class="check">
          <input type="checkbox" [ngModel]="confirmSuper()" (ngModelChange)="confirmSuper.set($event)" />
          I understand and want to grant Super Admin.
        </label>
      }

      <p class="note">This changes the user's permissions. The change is recorded in the audit log.</p>

      <div modalActions>
        <button type="button" class="ghost" (click)="cancel()" [disabled]="busy()">Cancel</button>
        <button type="button" class="primary" (click)="save()" [disabled]="busy() || !valid()">
          {{ busy() ? 'Saving…' : 'Change role' }}
        </button>
      </div>
    </fem-modal>
  `,
  styles: [
    `
      .who { margin: 0; font-size: 0.82rem; color: var(--text-secondary); }
      .rolerow { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
      .pill { padding: 3px 10px; border-radius: 999px; background: var(--surface-raised); border: 1px solid var(--border); }
      .pill.new { border-color: var(--accent); color: var(--accent-strong); }
      .field { display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: var(--text-secondary); }
      select, input {
        height: 40px; border-radius: 10px; border: 1px solid var(--border);
        background: var(--surface-raised); color: var(--text-primary); padding: 0 10px; font: inherit; font-size: 0.9rem;
      }
      .warn {
        margin: 0; padding: 8px 10px; font-size: 0.8rem; border-radius: 8px;
        background: var(--accent-soft); border: 1px solid var(--accent); color: var(--text-primary);
      }
      .check { display: flex; gap: 8px; align-items: center; font-size: 0.82rem; }
      .note { margin: 0; font-size: 0.76rem; color: var(--text-tertiary); }
      .form-error {
        margin: 0; background: rgba(226, 105, 75, 0.12); border: 1px solid var(--negative);
        border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; color: var(--text-primary);
      }
      [modalActions] button { height: 40px; padding: 0 16px; border-radius: 8px; font: inherit; font-size: 0.88rem; cursor: pointer; }
      [modalActions] button:disabled { opacity: 0.6; cursor: default; }
      .ghost { border: 1px solid var(--border); background: none; color: var(--text-secondary); }
      .primary { border: none; background: var(--accent); color: #14161c; font-weight: 600; }
    `,
  ],
})
export class AdminRoleDialog {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  readonly user = input.required<AdminUserListItem>();
  readonly families = input.required<AdminFamilyListItem[]>();
  readonly done = output<void>();
  readonly closed = output<void>();

  private readonly modal = viewChild(Modal);

  protected readonly roles = ROLES;
  protected reason = '';
  protected readonly confirmSuper = signal(false);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');

  protected readonly currentRole = computed<AssignableRole | 'None'>(() => {
    const u = this.user();
    if (u.platformRole === 'SuperAdmin') return 'SuperAdmin';
    return (u.familyRole as AssignableRole) ?? 'None';
  });

  protected readonly role = signal<AssignableRole>('Member');
  protected readonly familyId = signal<string>('');

  protected readonly needsFamily = computed(
    () => this.role() !== 'SuperAdmin' && !this.user().familyId,
  );

  protected readonly valid = computed(() => {
    if (this.role() === 'SuperAdmin') return this.confirmSuper();
    if (this.needsFamily()) return !!this.familyId();
    return this.role() !== this.currentRole();
  });

  constructor() {
    // default the select to the current role once inputs are bound
    queueMicrotask(() => {
      const cur = this.currentRole();
      if (cur !== 'None') this.role.set(cur);
    });
  }

  protected cancel(): void {
    if (!this.busy()) this.closed.emit();
  }

  protected async save(): Promise<void> {
    if (this.busy() || !this.valid()) return;
    this.busy.set(true);
    const m = this.modal();
    if (m) m.busy = true;
    this.formError.set('');
    try {
      await firstValueFrom(
        this.api.changeRole(this.user().id!, {
          role: this.role(),
          familyId: this.needsFamily() ? this.familyId() : null,
          reason: this.reason.trim() || null,
          confirmSuperAdmin: this.role() === 'SuperAdmin' ? this.confirmSuper() : false,
        }),
      );
      this.toast.success('Role changed.');
      this.done.emit();
      this.closed.emit();
    } catch (e) {
      this.formError.set(messageFor(e));
    } finally {
      this.busy.set(false);
      if (m) m.busy = false;
    }
  }
}
