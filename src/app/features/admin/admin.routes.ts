import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./admin-dashboard').then((m) => m.AdminDashboardPage) },
      { path: 'users', loadComponent: () => import('./admin-users').then((m) => m.AdminUsersPage) },
      { path: 'users/:id', loadComponent: () => import('./admin-user-detail').then((m) => m.AdminUserDetailPage) },
      { path: 'families', loadComponent: () => import('./admin-families').then((m) => m.AdminFamiliesPage) },
      { path: 'audit-logs', loadComponent: () => import('./admin-audit-logs').then((m) => m.AdminAuditLogsPage) },
    ],
  },
];
