import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProfileMenu } from '../../layout/profile-menu';
import { ToastHost } from '../../shared/components/toast-host';
import { ViewportService } from '../../shared/services/viewport.service';

interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
}

const ADMIN_NAV: AdminNavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '◉' },
  { path: '/admin/users', label: 'Users', icon: '≡' },
  { path: '/admin/families', label: 'Families', icon: '👪' },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: '▤' },
];

@Component({
  selector: 'fem-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ProfileMenu, ToastHost],
  template: `
    @if (vp.isDesktop()) {
      <aside class="sidebar">
        <div class="brand">
          <span class="mark">₹</span>
          <div>
            <div class="name">Ghar Khata</div>
            <div class="tag">Administration</div>
          </div>
        </div>
        <nav>
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">
              <span class="ico" aria-hidden="true">{{ item.icon }}</span>{{ item.label }}
            </a>
          }
        </nav>
      </aside>
    }

    <div class="main">
      <header class="topbar">
        @if (!vp.isDesktop()) {
          <span class="mark sm">₹</span>
          <span class="htitle">Administration</span>
        }
        <span class="spacer"></span>
        <fem-profile-menu />
      </header>

      @if (!vp.isDesktop()) {
        <nav class="tabs">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">{{ item.label }}</a>
          }
        </nav>
      }

      <main class="content">
        <router-outlet />
      </main>
    </div>

    <fem-toast-host />
  `,
  styles: [
    `
      :host { display: flex; min-height: 100vh; background: var(--bg); }
      .mark {
        display: inline-grid; place-items: center;
        width: 34px; height: 34px; border-radius: 9px;
        background: var(--accent); color: #14161c;
        font-family: var(--font-display); font-weight: 600;
      }
      .mark.sm { width: 28px; height: 28px; border-radius: 7px; font-size: 0.85rem; }

      .sidebar {
        width: 248px; flex-shrink: 0; position: sticky; top: 0; height: 100vh;
        background: var(--bg-elevated); border-right: 1px solid var(--border);
        padding: 20px 14px; overflow-y: auto;
      }
      .brand { display: flex; gap: 12px; align-items: center; padding: 0 6px 18px; }
      .brand .name { font-family: var(--font-display); font-weight: 600; }
      .brand .tag { font-size: 0.72rem; color: var(--accent-strong); letter-spacing: 0.04em; text-transform: uppercase; }
      .sidebar nav { display: flex; flex-direction: column; gap: 2px; }
      .sidebar a {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; border-radius: 9px;
        color: var(--text-secondary); text-decoration: none; font-size: 0.9rem; min-height: 44px;
      }
      .sidebar a:hover { color: var(--text-primary); background: var(--surface); }
      .sidebar a.active { background: var(--accent-soft); color: var(--accent-strong); }
      .ico { width: 20px; text-align: center; }

      .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
      .topbar {
        position: sticky; top: 0; z-index: 10; height: 68px;
        display: flex; align-items: center; gap: 12px; padding: 0 32px 0 24px;
        background: rgba(20, 22, 28, 0.8); backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
      }
      .htitle { font-family: var(--font-display); font-weight: 600; }
      .spacer { flex: 1; }

      .tabs {
        display: flex; gap: 4px; overflow-x: auto; padding: 8px 16px;
        border-bottom: 1px solid var(--border); background: var(--bg-elevated);
      }
      .tabs a {
        white-space: nowrap; padding: 8px 12px; border-radius: 8px; min-height: 40px;
        display: grid; place-items: center; font-size: 0.85rem;
        color: var(--text-secondary); text-decoration: none;
      }
      .tabs a.active { background: var(--accent-soft); color: var(--accent-strong); }

      .content { flex: 1; padding: 24px; max-width: 1180px; width: 100%; margin: 0 auto; }
      @media (max-width: 979px) { .content { padding: 16px; } }
    `,
  ],
})
export class AdminShell {
  protected readonly vp = inject(ViewportService);
  protected readonly nav = ADMIN_NAV;
}
