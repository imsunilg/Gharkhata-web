import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  retry,
  switchMap,
  take,
  throwError,
  timer,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../services/toast.service';
import type { ProblemDetails } from '../api/models';

/** 1 — correlation: attach an X-Correlation-Id to every request. */
export const correlationInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Correlation-Id': crypto.randomUUID() } }));

// Shared refresh state so concurrent 401s trigger exactly one refresh.
let refreshing = false;
const refreshed$ = new BehaviorSubject<string | null>(null);

/** 2 — auth: attach the bearer token; on 401, refresh ONCE and queue concurrent requests. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const withAuth = (token: string | null): HttpRequest<unknown> =>
    token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  const isAuthCall = req.url.includes('/auth/');

  return next(withAuth(auth.accessToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthCall) return throwError(() => err);

      if (refreshing) {
        // Wait for the in-flight refresh, then replay this request once.
        return refreshed$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((token) => next(withAuth(token))),
        );
      }

      refreshing = true;
      refreshed$.next(null);

      return auth.refresh().pipe(
        switchMap((res) => {
          refreshing = false;
          refreshed$.next(res.accessToken ?? null);
          return next(withAuth(res.accessToken ?? null));
        }),
        catchError((refreshErr) => {
          refreshing = false;
          refreshed$.next(null);
          auth.logout();
          void router.navigate(['/auth/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

/** 3 — error: map Problem Details to user messages; route 5xx to a toast; never leak stack traces. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem = err.error as ProblemDetails | undefined;
      if (err.status >= 500) {
        toast.error('Something went wrong. Please try again.');
      } else if (err.status === 0) {
        toast.error('Cannot reach the server.');
      }
      const message =
        problem?.errors
          ? Object.values(problem.errors).flat().join(' ')
          : problem?.title ?? err.message;
      return throwError(() => ({ ...err, userMessage: message, problem }));
    }),
  );
};

/** 4 — retry: idempotent GETs twice with backoff; NEVER retry mutations. */
export const retryInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: 2,
      delay: (err: HttpErrorResponse, attempt) => {
        if (err.status && err.status < 500 && err.status !== 0) return throwError(() => err);
        return timer(attempt * 300);
      },
    }),
  ) as Observable<never>;
};

export const INTERCEPTORS = [
  correlationInterceptor,
  authInterceptor,
  errorInterceptor,
  retryInterceptor,
];

/** Test-only: reset the module-level refresh latch between specs. */
export function __resetAuthInterceptorState(): void {
  refreshing = false;
  refreshed$.next(null);
}
