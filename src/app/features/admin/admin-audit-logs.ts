import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminApiService } from './admin-api.service';
import type { AdminAuditEntryPagedResult } from '../../core/api/models';

const ACTIONS = [
  'USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_SUSPENDED',
  'USER_DELETED', 'USER_RESTORED', 'ROLE_CHANGED', 'PASSWORD_RESET', 'FAMILY_CHANGED', 'LOGIN', 'LOGOUT',
];
const DATE_RANGES = [
  { v: '', label: 'Any time' },
  { v: 'today', label: 'Today' },
  { v: '7d', label: 'Last 7 days' },
  { v: '30d', label: 'Last 30 days' },
];

@Component({
  selector: 'fem-admin-audit-logs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule],
  template: `
    <header class="head">
      <h1>Audit logs</h1>
      <p class="sub">{{ total().toLocaleString() }} recorded administrative event{{ total() === 1 ? '' : 's' }}.</p>
    </header>

    <div class="toolbar">
      <select [ngModel]="action()" (ngModelChange)="apply({ action: $event })" aria-label="Action">
        <option value="">All actions</option>
        @for (a of actions; track a) { <option [value]="a">{{ a }}</option> }
      </select>
      <select [ngModel]="range()" (ngModelChange)="apply({ range: $event })" aria-label="Date range">
        @for (d of dateRanges; track d.v) { <option [value]="d.v">{{ d.label }}</option> }
      </select>
      @if (targetUserId()) {
        <button type="button" class="clear" (click)="apply({ targetUserId: null })">Clear user filter ✕</button>
      }
    </div>

    @if (error()) {
      <div class="panel err" role="alert">Couldn't load audit logs. <button type="button" (click)="load()">Retry</button></div>
    } @else {
      <div class="tablewrap">
        <table>
          <thead>
            <tr><th>When</th><th>Action</th><th>Actor</th><th>Target</th><th>Change</th><th class="col-md">IP</th></tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr><td colspan="6" class="muted">Loading…</td></tr>
            } @else if (rows().length === 0) {
              <tr><td colspan="6" class="muted">No events match these filters.</td></tr>
            } @else {
              @for (e of rows(); track e.id) {
                <tr>
                  <td class="muted">{{ e.timestamp | date: 'dd MMM y, HH:mm' }}</td>
                  <td><span class="act">{{ e.action }}</span></td>
                  <td class="muted">{{ e.actorEmail ?? '—' }}</td>
                  <td class="muted">{{ e.target ?? '—' }}</td>
                  <td class="muted">{{ (e.oldValue || e.newValue) ? ((e.oldValue ?? '—') + ' → ' + (e.newValue ?? '—')) : '—' }}{{ e.reason ? ' (' + e.reason + ')' : '' }}</td>
                  <td class="col-md muted">{{ e.ipAddress ?? '—' }}</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      @if (!loading() && rows().length > 0) {
        <footer class="pager">
          <span>Page {{ page() }} of {{ totalPages() }}</span>
          <nav class="pages">
            <button type="button" (click)="go(page() - 1)" [disabled]="page() <= 1">Previous</button>
            <button type="button" (click)="go(page() + 1)" [disabled]="page() >= totalPages()">Next</button>
          </nav>
        </footer>
      }
    }
  `,
  styles: [
    `
      .head { margin-bottom: 14px; }
      h1 { font-size: 1.5rem; margin: 0; }
      .sub { color: var(--text-tertiary); margin: 4px 0 0; font-size: 0.88rem; }
      .toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
      .toolbar select, .clear {
        height: 38px; border-radius: 10px; border: 1px solid var(--border);
        background: var(--surface); color: var(--text-primary); padding: 0 12px; font-size: 0.85rem; cursor: pointer;
      }
      .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
      .panel.err { border-color: var(--negative); }
      .panel button { margin-left: 10px; height: 30px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); cursor: pointer; }
      .tablewrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
      table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
      th, td { text-align: left; padding: 10px 14px; white-space: nowrap; }
      thead th { color: var(--text-secondary); font-weight: 500; font-size: 0.76rem; border-bottom: 1px solid var(--border); }
      tbody tr + tr td { border-top: 1px solid var(--border); }
      .muted { color: var(--text-tertiary); }
      .act { font-weight: 600; font-size: 0.78rem; }
      .pager { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 0.82rem; color: var(--text-secondary); }
      .pages { display: flex; gap: 6px; }
      .pages button { min-width: 84px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); cursor: pointer; }
      .pages button:disabled { opacity: 0.4; cursor: default; }
      @media (max-width: 720px) { .col-md { display: none; } }
    `,
  ],
})
export class AdminAuditLogsPage {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly actions = ACTIONS;
  protected readonly dateRanges = DATE_RANGES;

  protected readonly data = signal<AdminAuditEntryPagedResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly action = signal('');
  protected readonly range = signal('');
  protected readonly targetUserId = signal<string | null>(null);
  protected readonly page = signal(1);

  protected readonly rows = computed(() => this.data()?.items ?? []);
  protected readonly total = computed(() => this.data()?.totalCount ?? 0);
  protected readonly totalPages = computed(() => this.data()?.totalPages ?? 1);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((q) => {
      this.action.set(q.get('action') ?? '');
      this.range.set(q.get('range') ?? '');
      this.targetUserId.set(q.get('targetUserId'));
      this.page.set(Math.max(1, Number(q.get('page') ?? 1)));
      void this.load();
    });
  }

  protected apply(patch: Record<string, string | null>): void {
    void this.router.navigate([], {
      queryParams: { ...patch, page: 1 },
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    });
  }

  protected go(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    void this.router.navigate([], { queryParams: { page: p }, queryParamsHandling: 'merge', relativeTo: this.route });
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    const now = new Date();
    const from =
      this.range() === 'today' ? now
      : this.range() === '7d' ? new Date(now.getTime() - 6 * 864e5)
      : this.range() === '30d' ? new Date(now.getTime() - 29 * 864e5)
      : null;
    try {
      this.data.set(await firstValueFrom(this.api.auditLogs({
        action: this.action() || undefined,
        targetUserId: this.targetUserId() || undefined,
        from: from ? from.toISOString().slice(0, 10) : undefined,
        page: this.page(),
        pageSize: 50,
      })));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
