import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetAuthInterceptorState,
  authInterceptor,
  retryInterceptor,
} from './interceptors';
import { AuthService } from '../auth/auth.service';

describe('authInterceptor — concurrent refresh queueing', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    __resetAuthInterceptorState();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.setAccessToken('expired-token');
    localStorage.setItem('ghk.refresh', 'refresh-token');
  });

  it('five parallel 401s trigger exactly one refresh, then all replay', async () => {
    const results: number[] = [];
    for (let i = 0; i < 5; i++) {
      http.get(`/api/v1/expenses?p=${i}`).subscribe(() => results.push(i));
    }

    // All 5 initial requests fail with 401.
    const first = httpMock.match((r) => r.url.includes('/expenses'));
    expect(first.length).toBe(5);
    first.forEach((r) => r.flush({}, { status: 401, statusText: 'Unauthorized' }));

    // Exactly ONE refresh call.
    const refreshCalls = httpMock.match((r) => r.url.includes('/auth/refresh'));
    expect(refreshCalls.length).toBe(1);
    refreshCalls[0].flush({ accessToken: 'fresh-token', refreshToken: 'r2' });

    // All 5 replay with the fresh token.
    const replays = httpMock.match((r) => r.url.includes('/expenses'));
    expect(replays.length).toBe(5);
    replays.forEach((r) => {
      expect(r.request.headers.get('Authorization')).toBe('Bearer fresh-token');
      r.flush({ items: [] });
    });

    await Promise.resolve();
    expect(results.sort()).toEqual([0, 1, 2, 3, 4]);
    httpMock.verify();
  });
});

describe('retryInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([retryInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  it('does not retry a POST', () => {
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    http.post('/api/v1/expenses', {}).subscribe({ error: () => undefined });
    const reqs = httpMock.match((r) => r.url.includes('/expenses'));
    expect(reqs.length).toBe(1);
    reqs[0].flush({}, { status: 500, statusText: 'Server Error' });
    httpMock.verify();
  });
});
