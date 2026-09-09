import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminApiService } from './admin-api.service';
import type { AdminFamilyListItem } from '../../core/api/models';

@Component({
  selector: 'fem-admin-families',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <header class="head">
      <h1>Families</h1>
      <p class="sub">{{ families().length }} famil{{ families().length === 1 ? 'y' : 'ies' }} on the platform.</p>
    </header>

    @if (error()) {
      <div class="panel err" role="alert">Couldn't load families. <button type="button" (click)="load()">Retry</button></div>
    } @else if (loading()) {
      <div class="panel">Loading…</div>
    } @else if (families().length === 0) {
      <div class="panel muted">No families yet.</div>
    } @else {
      <div class="tablewrap">
        <table>
          <thead>
            <tr><th>Family</th><th>Members</th><th>Created</th><th></th></tr>
          </thead>
          <tbody>
            @for (f of families(); track f.id) {
              <tr>
                <td>{{ f.name }}</td>
                <td>{{ f.memberCount }}</td>
                <td class="muted">{{ f.createdAt | date: 'dd MMM y' }}</td>
                <td class="right">
                  <a [routerLink]="['/admin/users']" [queryParams]="{ familyId: f.id }">View members</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [
    `
      .head { margin-bottom: 16px; }
      h1 { font-size: 1.5rem; margin: 0; }
      .sub { color: var(--text-tertiary); margin: 4px 0 0; font-size: 0.88rem; }
      .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
      .panel.err { border-color: var(--negative); }
      .panel button { margin-left: 10px; height: 30px; padding: 0 10px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); cursor: pointer; }
      .muted { color: var(--text-tertiary); }
      .tablewrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
      table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
      th, td { text-align: left; padding: 11px 14px; white-space: nowrap; }
      thead th { color: var(--text-secondary); font-weight: 500; font-size: 0.78rem; border-bottom: 1px solid var(--border); }
      tbody tr + tr td { border-top: 1px solid var(--border); }
      .right { text-align: right; }
      .right a { color: var(--accent-strong); text-decoration: none; font-size: 0.82rem; }
    `,
  ],
})
export class AdminFamiliesPage {
  private readonly api = inject(AdminApiService);

  protected readonly families = signal<AdminFamilyListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly count = computed(() => this.families().length);

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.families.set(await firstValueFrom(this.api.families()));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
