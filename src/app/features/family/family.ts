import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../../core/config';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';
import type { MemberResponse } from '../../core/api/models';

@Component({
  selector: 'fem-family',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <h1>Family</h1>
    <div class="grid">
      @for (m of members(); track m.id) {
        <article class="card">
          <div class="avatar">{{ (m.displayName ?? '?').charAt(0) }}</div>
          <span class="nm">{{ m.displayName }}</span>
          <span class="role" [class.owner]="m.role === 'Owner'">{{ m.role }}</span>
          <span class="muted">{{ m.status }}</span>
        </article>
      }
    </div>

    @if (canManage()) {
      <form (ngSubmit)="invite()">
        <input type="email" [(ngModel)]="inviteEmail" name="email" placeholder="member@example.com" required />
        <select [(ngModel)]="inviteRole" name="role">
          <option value="Admin">Admin</option>
          <option value="Member">Member</option>
          <option value="Viewer">Viewer</option>
        </select>
        <button type="submit">Invite</button>
      </form>
      @if (lastToken()) {
        <p class="token">Invite token (local mode): <code>{{ lastToken() }}</code></p>
      }
    }
  `,
  styles: [
    `
      h1 { font-size: 1.6rem; margin: 0 0 14px; }
      .muted { color: var(--text-tertiary); font-size: 0.78rem; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
      @media (max-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .avatar { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-raised); text-transform: uppercase; font-weight: 600; }
      .nm { font-family: var(--font-display); }
      .role { font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border); color: var(--text-secondary); }
      .role.owner { border-color: var(--accent); color: var(--accent-strong); }
      form { display: flex; gap: 8px; flex-wrap: wrap; }
      form input, form select { height: 40px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); padding: 0 10px; }
      form button { height: 40px; padding: 0 16px; border-radius: 8px; border: none; background: var(--accent); color: #14161c; font-weight: 600; }
      .token { font-size: 0.8rem; color: var(--text-secondary); margin-top: 10px; }
      code { background: var(--surface-raised); padding: 2px 6px; border-radius: 5px; }
    `,
  ],
})
export class FamilyPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly reference = inject(ReferenceDataStore);

  protected readonly members = signal<MemberResponse[]>([]);
  protected readonly lastToken = signal<string | null>(null);
  protected inviteEmail = '';
  protected inviteRole = 'Member';

  protected canManage() {
    return ['Owner', 'Admin'].includes(this.auth.user()?.role ?? '');
  }

  constructor() {
    void this.load();
  }

  protected async invite() {
    if (!this.inviteEmail) return;
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string }>(`${API_BASE}/families/current/invites`, {
          email: this.inviteEmail,
          role: this.inviteRole,
        }),
      );
      this.lastToken.set(res.token);
      this.toast.success('Invite created');
      this.inviteEmail = '';
      this.reference.invalidate();
      await this.load();
    } catch (e) {
      this.toast.error((e as { userMessage?: string })?.userMessage ?? 'Could not send the invite.');
    }
  }

  private async load() {
    this.members.set(
      await firstValueFrom(this.http.get<MemberResponse[]>(`${API_BASE}/families/current/members`)),
    );
  }
}
