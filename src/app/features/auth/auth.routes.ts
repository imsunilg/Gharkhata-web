import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards';

export const AUTH_ROUTES: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./login').then((m) => m.LoginPage) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./register').then((m) => m.RegisterPage) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password').then((m) => m.ForgotPasswordPage) },
  { path: 'reset-password', loadComponent: () => import('./reset-password').then((m) => m.ResetPasswordPage) },
  { path: 'create-family', loadComponent: () => import('./create-family').then((m) => m.CreateFamilyPage) },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
];
