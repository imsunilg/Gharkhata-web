import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE, STORAGE_KEYS } from '../config';
import type { AuthResponse, CreateFamilyResponse, MeResponse } from '../api/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _accessToken = signal<string | null>(null);
  private readonly _user = signal<MeResponse | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly hasFamily = computed(() => !!this._user()?.familyId);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(tap((r) => this.accept(r)));
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, { email, password, displayName })
      .pipe(tap((r) => this.accept(r)));
  }

  createFamily(name: string, timezone: string, monthStartDay: number): Observable<CreateFamilyResponse> {
    return this.http
      .post<CreateFamilyResponse>(`${API_BASE}/families`, { name, timezone, monthStartDay })
      .pipe(
        tap((r) => {
          if (r.accessToken) this._accessToken.set(r.accessToken);
        }),
      );
  }

  loadMe(): Observable<MeResponse> {
    return this.http
      .get<MeResponse>(`${API_BASE}/auth/me`)
      .pipe(tap((me) => this._user.set(me)));
  }

  refresh(): Observable<AuthResponse> {
    const token = this.storedRefreshToken();
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/refresh`, { refreshToken: token })
      .pipe(tap((r) => this.accept(r)));
  }

  logout(): void {
    const token = this.storedRefreshToken();
    if (token) {
      this.http.post(`${API_BASE}/auth/logout`, { refreshToken: token }).subscribe({ error: () => undefined });
    }
    this._accessToken.set(null);
    this._user.set(null);
    this.clearRefreshToken();
  }

  setAccessToken(token: string): void {
    this._accessToken.set(token);
  }

  private accept(r: AuthResponse): void {
    if (r.accessToken) this._accessToken.set(r.accessToken);
    if (r.refreshToken) this.storeRefreshToken(r.refreshToken);
  }

  private storedRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.refreshToken);
    } catch {
      return null;
    }
  }

  private storeRefreshToken(token: string): void {
    // The API does not set an httpOnly cookie in local mode, so localStorage is
    // the fallback. Tradeoff: readable by scripts on this origin; acceptable for
    // local dev, revisit before production (httpOnly cookie).
    try {
      localStorage.setItem(STORAGE_KEYS.refreshToken, token);
    } catch {
      /* private mode */
    }
  }

  private clearRefreshToken(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
    } catch {
      /* ignore */
    }
  }
}
