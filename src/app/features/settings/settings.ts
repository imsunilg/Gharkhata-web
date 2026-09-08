import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';

@Component({
  selector: 'fem-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <h1>Settings</h1>
    <div class="cols">
      <section class="panel">
        <h2>Accounts</h2>
        <ul>
          @for (a of reference.accounts(); track a.id) {
            <li>
              <span>{{ a.name }}</span>
              <span class="muted">{{ a.type }}{{ a.lastFour ? ' ···· ' + a.lastFour : '' }}</span>
            </li>
          } @empty {
            <li class="muted">No accounts yet.</li>
          }
        </ul>
      </section>

      <section class="panel">
        <h2>Profile</h2>
        <dl>
          <div><dt>Name</dt><dd>{{ auth.user()?.displayName }}</dd></div>
          <div><dt>Email</dt><dd>{{ auth.user()?.email }}</dd></div>
          <div><dt>Role</dt><dd>{{ auth.user()?.role }}</dd></div>
          <div><dt>Family</dt><dd>{{ auth.user()?.familyName }}</dd></div>
        </dl>
        <button type="button" class="danger" (click)="logout()">Sign out</button>
      </section>

      <section class="panel">
        <h2>Privacy</h2>
        <p class="muted">
          Personal expenses count toward family totals and budgets, but their title,
          category, notes and receipts are visible only to the person who recorded them —
          no role, including the Owner, can see another member's personal detail.
        </p>
      </section>
    </div>
  `,
  styles: [
    `
      h1 { font-size: 1.6rem; margin: 0 0 14px; }
      .muted { color: var(--text-tertiary); }
      .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      @media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
      .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
      .panel h2 { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 12px; }
      ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      li { display: flex; justify-content: space-between; font-size: 0.88rem; }
      dl { margin: 0; display: flex; flex-direction: column; gap: 8px; }
      dl > div { display: flex; gap: 12px; font-size: 0.88rem; }
      dt { width: 70px; color: var(--text-tertiary); }
      dd { margin: 0; }
      .danger { margin-top: 14px; height: 40px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--negative); background: none; color: var(--negative); }
    `,
  ],
})
export class SettingsPage {
  protected readonly auth = inject(AuthService);
  protected readonly reference = inject(ReferenceDataStore);
  private readonly router = inject(Router);
  protected readonly _ = signal(0);

  protected logout() {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
