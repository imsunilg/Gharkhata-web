import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Modal } from '../../shared/components/modal';
import { ToastService } from '../../core/services/toast.service';
import { AdminApiService } from './admin-api.service';
import { messageFor } from './admin-action-dialog';
import type { AdminFamilyListItem, AdminUserListItem, AssignableRole } from '../../core/api/models';

const MIN = 8;
const ROLES: AssignableRole[] = ['Member', 'Admin', 'Owner', 'SuperAdmin'];
const STATUSES = ['Active', 'Inactive', 'Suspended'] as const;

interface FormValue {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: AssignableRole;
  familyId: string;
  status: string;
  confirmSuperAdmin: boolean;
}

@Component({
  selector: 'fem-admin-user-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Modal],
  template: `
    <fem-modal [title]="editing() ? 'Edit user' : 'Create user'" (closed)="cancel()">
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (formError()) {
          <p class="form-error" aria-live="assertive">{{ formError() }}</p>
        }

        <label class="field">
          <span>Name</span>
          <input formControlName="displayName" autocomplete="name" />
          @if (err('displayName')) { <em>Enter a name.</em> }
        </label>

        <label class="field">
          <span>Email</span>
          <input formControlName="email" type="email" autocomplete="off" />
          @if (err('email')) { <em>Enter a valid email address.</em> }
        </label>

        @if (!editing()) {
          <label class="field">
            <span>Password</span>
            <input formControlName="password" [type]="reveal() ? 'text' : 'password'" autocomplete="new-password" />
            <button type="button" class="reveal" (click)="reveal.set(!reveal())" [attr.aria-label]="reveal() ? 'Hide' : 'Reveal'">
              {{ reveal() ? '🙈' : '👁' }}
            </button>
            @if (err('password')) { <em>At least {{ MIN }} characters.</em> }
          </label>
          <label class="field">
            <span>Confirm password</span>
            <input formControlName="confirmPassword" [type]="reveal() ? 'text' : 'password'" autocomplete="new-password" />
            @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) { <em>The passwords do not match.</em> }
          </label>

          <label class="field">
            <span>Role</span>
            <select formControlName="role">
              @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
            </select>
          </label>

          @if (form.value.role !== 'SuperAdmin') {
            <label class="field">
              <span>Family</span>
              <select formControlName="familyId">
                <option value="">Select a family…</option>
                @for (f of families(); track f.id) { <option [value]="f.id">{{ f.name }}</option> }
              </select>
              @if (err('familyId')) { <em>Choose a family, or create the user as a Super Admin.</em> }
            </label>
          } @else {
            <p class="warn">
              Super Admins have platform-wide control over every user and family. Grant this only to
              trusted operators.
            </p>
            <label class="check">
              <input type="checkbox" formControlName="confirmSuperAdmin" />
              I understand and want to create a Super Admin.
            </label>
            @if (err('confirmSuperAdmin')) { <em>Confirmation is required.</em> }
          }
        }

        <label class="field">
          <span>Status</span>
          <select formControlName="status">
            @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </label>

        <div modalActions>
          <button type="button" class="ghost" (click)="cancel()" [disabled]="busy()">Cancel</button>
          <button type="submit" class="primary" [disabled]="busy()">
            {{ busy() ? 'Saving…' : editing() ? 'Save changes' : 'Create user' }}
          </button>
        </div>
      </form>
    </fem-modal>
  `,
  styles: [
    `
      form { display: contents; }
      .field { display: flex; flex-direction: column; gap: 5px; font-size: 0.8rem; color: var(--text-secondary); position: relative; }
      input, select {
        height: 40px; border-radius: 10px; border: 1px solid var(--border);
        background: var(--surface-raised); color: var(--text-primary); padding: 0 10px; font: inherit; font-size: 0.9rem;
      }
      input[type='password'], input[formcontrolname='password'], input[formcontrolname='confirmPassword'] { padding-right: 40px; }
      .reveal { position: absolute; right: 4px; top: 22px; height: 34px; width: 34px; border: none; background: none; color: var(--text-tertiary); cursor: pointer; }
      .check { display: flex; gap: 8px; align-items: center; font-size: 0.82rem; color: var(--text-primary); }
      em { color: var(--negative); font-size: 0.76rem; font-style: normal; }
      .warn {
        margin: 0; padding: 8px 10px; font-size: 0.8rem; border-radius: 8px;
        background: var(--accent-soft); border: 1px solid var(--accent); color: var(--text-primary);
      }
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
export class AdminUserFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  /** When present the dialog is in edit mode. */
  readonly user = input<AdminUserListItem | null>(null);
  readonly families = input.required<AdminFamilyListItem[]>();
  readonly done = output<void>();
  readonly closed = output<void>();

  private readonly modal = viewChild(Modal);

  protected readonly MIN = MIN;
  protected readonly roles = ROLES;
  protected readonly statuses = STATUSES;
  protected readonly reveal = signal(false);
  protected readonly busy = signal(false);
  protected readonly formError = signal('');
  protected readonly editing = computed(() => !!this.user());

  protected readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.maxLength(120)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      confirmPassword: [''],
      role: ['Member' as AssignableRole],
      familyId: [''],
      status: ['Active'],
      confirmSuperAdmin: [false],
    },
    { validators: [(g): Record<string, boolean> | null => this.crossValidate(g.getRawValue() as FormValue)] },
  );

  constructor() {
    queueMicrotask(() => {
      const u = this.user();
      if (u) {
        this.form.patchValue({
          displayName: u.displayName ?? '',
          email: u.email ?? '',
          status: u.status ?? 'Active',
        });
      }
    });
  }

  private crossValidate(v: FormValue): Record<string, boolean> | null {
    const errors: Record<string, boolean> = {};
    if (!this.editing()) {
      if ((v.password?.length ?? 0) < MIN) errors['weakPassword'] = true;
      if (v.password && v.confirmPassword && v.password !== v.confirmPassword) errors['mismatch'] = true;
      if (v.role === 'SuperAdmin' && !v.confirmSuperAdmin) errors['needSuperConfirm'] = true;
      if (v.role !== 'SuperAdmin' && !v.familyId) errors['needFamily'] = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  protected err(name: string): boolean {
    const c = this.form.get(name);
    const dirty = !!c && (c.dirty || c.touched);
    if (name === 'password') return dirty && this.form.hasError('weakPassword');
    if (name === 'familyId') return this.form.get('familyId')!.touched && this.form.hasError('needFamily');
    if (name === 'confirmSuperAdmin') return this.form.hasError('needSuperConfirm') && !!this.form.get('confirmSuperAdmin')?.touched;
    return !!c && c.invalid && dirty;
  }

  protected cancel(): void {
    if (!this.busy()) this.closed.emit();
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const m = this.modal();
    if (m) m.busy = true;
    this.formError.set('');
    const v = this.form.getRawValue();
    try {
      if (this.editing()) {
        await firstValueFrom(this.api.updateUser(this.user()!.id!, {
          displayName: v.displayName.trim(),
          email: v.email.trim(),
          status: v.status,
        }));
        this.toast.success('User updated.');
      } else {
        await firstValueFrom(this.api.createUser({
          displayName: v.displayName.trim(),
          email: v.email.trim(),
          password: v.password,
          confirmPassword: v.confirmPassword,
          role: v.role,
          familyId: v.role === 'SuperAdmin' ? null : v.familyId,
          status: v.status,
          confirmSuperAdmin: v.role === 'SuperAdmin' ? v.confirmSuperAdmin : false,
        }));
        this.toast.success('User created.');
      }
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
