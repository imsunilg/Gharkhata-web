import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./admin-dashboard').then((m) => m.AdminDashboardPage) },
      { path: 'users', loadComponent: () => import('./admin-users').then((m) => m.AdminUsersPage) },
    ],
  },
];
