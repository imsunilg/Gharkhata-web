import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from './admin-api.service';
import type { AdminDashboardResponse } from '../../core/api/models';

interface StatCard {
  label: string;
  value: number;
  accent?: 'default' | 'positive' | 'warning' | 'negative';
  link?: Record<string, string | undefined>;
}

@Component({
  selector: 'fem-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="head">
      <h1>Admin dashboard</h1>
      <p class="sub">Platform-wide user and family statistics.</p>
    </header>

    @if (error()) {
      <div class="panel error" role="alert">
        Couldn't load statistics.
        <button type="button" (click)="load()">Retry</button>
      </div>
    } @else if (loading()) {
      <div class="grid">
        @for (i of skeletons; track i) {
          <div class="card skeleton" aria-hidden="true"></div>
        }
      </div>
    } @else {
      <section class="grid" aria-label="User statistics">
        @for (c of cards(); track c.label) {
          @if (c.link) {
            <a class="card" [class]="c.accent" [routerLink]="['/admin/users']" [queryParams]="c.link">
              <span class="value">{{ c.value.toLocaleString() }}</span>
              <span class="label">{{ c.label }}</span>
            </a>
          } @else {
            <div class="card" [class]="c.accent">
              <span class="value">{{ c.value.toLocaleString() }}</span>
              <span class="label">{{ c.label }}</span>
            </div>
          }
        }
      </section>
    }
  `,
  styles: [
    `
      .head { margin-bottom: 18px; }
      h1 { font-size: 1.5rem; margin: 0; }
      .sub { color: var(--text-tertiary); margin: 4px 0 0; font-size: 0.88rem; }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
      }
      .card {
        display: flex; flex-direction: column; gap: 6px;
        padding: 18px; border-radius: var(--radius-md);
        background: var(--surface); border: 1px solid var(--border);
        text-decoration: none; color: inherit;
      }
      a.card:hover { border-color: var(--accent); }
      .value { font-family: var(--font-display); font-size: 1.9rem; font-weight: 600; line-height: 1; }
      .label { font-size: 0.8rem; color: var(--text-secondary); }
      .card.positive .value { color: var(--positive); }
      .card.warning .value { color: var(--accent-strong); }
      .card.negative .value { color: var(--negative); }

      .card.skeleton { height: 92px; background: var(--surface-raised); animation: pulse 1.4s ease-in-out infinite; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      @media (prefers-reduced-motion: reduce) { .card.skeleton { animation: none; } }

      .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
      .panel.error { border-color: var(--negative); }
      .panel button {
        margin-left: 12px; height: 32px; padding: 0 12px; border-radius: 8px;
        border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); cursor: pointer;
      }
    `,
  ],
})
export class AdminDashboardPage {
  private readonly api = inject(AdminApiService);

  protected readonly skeletons = Array.from({ length: 10 }, (_, i) => i);
  protected readonly data = signal<AdminDashboardResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly cards = computed<StatCard[]>(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { label: 'Total Users', value: d.totalUsers ?? 0 },
      { label: 'Active Users', value: d.activeUsers ?? 0, accent: 'positive', link: { status: 'Active' } },
      { label: 'Inactive Users', value: d.inactiveUsers ?? 0, link: { status: 'Inactive' } },
      { label: 'Suspended Users', value: d.suspendedUsers ?? 0, accent: 'warning', link: { status: 'Suspended' } },
      { label: 'Deleted Users', value: d.deletedUsers ?? 0, accent: 'negative', link: { status: 'Deleted' } },
      { label: 'Super Admins', value: d.superAdmins ?? 0, link: { role: 'SuperAdmin' } },
      { label: 'Owners', value: d.owners ?? 0, link: { role: 'Owner' } },
      { label: 'Admins', value: d.admins ?? 0, link: { role: 'Admin' } },
      { label: 'Members', value: d.members ?? 0, link: { role: 'Member' } },
      { label: 'Total Families', value: d.totalFamilies ?? 0 },
    ];
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.data.set(await firstValueFrom(this.api.dashboard()));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
