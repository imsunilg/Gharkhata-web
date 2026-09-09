import { Routes } from '@angular/router';
import { familyGuard, platformAdminGuard, roleGuard } from './core/auth/guards';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [platformAdminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [familyGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage) },
      { path: 'expenses', loadComponent: () => import('./features/expenses/expenses').then((m) => m.ExpensesPage) },
      { path: 'income', loadComponent: () => import('./features/income/income').then((m) => m.IncomePage) },
      {
        path: 'budgets',
        canActivate: [roleGuard(['Owner', 'Admin', 'Member', 'Viewer'])],
        loadComponent: () => import('./features/budgets/budgets').then((m) => m.BudgetsPage),
      },
      { path: 'bills', loadComponent: () => import('./features/bills/bills').then((m) => m.BillsPage) },
      { path: 'subscriptions', loadComponent: () => import('./features/subscriptions/subscriptions').then((m) => m.SubscriptionsPage) },
      { path: 'goals', loadComponent: () => import('./features/goals/goals').then((m) => m.GoalsPage) },
      { path: 'debts', loadComponent: () => import('./features/debts/debts').then((m) => m.DebtsPage) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsPage) },
      { path: 'family', loadComponent: () => import('./features/family/family').then((m) => m.FamilyPage) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
