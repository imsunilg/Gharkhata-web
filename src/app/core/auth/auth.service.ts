import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE, STORAGE_KEYS } from '../config';
import type { AuthResponse, CreateFamilyResponse, MeResponse } from '../api/models';

/** The single source of user identity for the UI — name, initials, email, role, last login. */
export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  role: string;
  lastLogin: string;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RS';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase() || 'RS';
}

export function formatLastLogin(date: Date | null, now: Date = new Date()): string {
  if (!date || Number.isNaN(date.getTime())) return 'Today, 9:42 AM';
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _accessToken = signal<string | null>(null);
  private readonly _user = signal<MeResponse | null>(null);
  private readonly _lastLoginAt = signal<Date | null>(this.readStoredLastLogin());

  readonly accessToken = this._accessToken.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly hasFamily = computed(() => !!this._user()?.familyId);

  /** Platform role — 'SuperAdmin' or null. Independent of any family role. */
  readonly platformRole = computed(() => this._user()?.platformRole ?? null);
  readonly isSuperAdmin = computed(() => this._user()?.platformRole === 'SuperAdmin');

  /** Derived identity for headers/menus — never hard-code these in components. */
  readonly profile = computed<UserProfile>(() => {
    const u = this._user();
    const name = u?.displayName?.trim() || 'Sunil Gadakari';
    return {
      name,
      initials: initialsOf(name),
      email: u?.email?.trim() || 'rahul@example.com',
      role: u?.platformRole === 'SuperAdmin'
        ? 'Super Admin'
        : u?.role ? `Family ${u.role}` : 'Family Owner',
      lastLogin: formatLastLogin(this._lastLoginAt()),
    };
  });

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(tap((r) => { this.accept(r); this.markLogin(); }));
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, { email, password, displayName })
      .pipe(tap((r) => { this.accept(r); this.markLogin(); }));
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

  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<void> {
    // Reuses the shared HttpClient (correlation + auth interceptors apply).
    // Nothing here is logged or stored — the payload lives only for the request.
    return this.http.post<void>(`${API_BASE}/auth/change-password`, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
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
    this._lastLoginAt.set(null);
    this.clearRefreshToken();
    try {
      localStorage.removeItem(STORAGE_KEYS.lastLoginAt);
    } catch {
      /* ignore */
    }
  }

  private markLogin(): void {
    const now = new Date();
    this._lastLoginAt.set(now);
    try {
      localStorage.setItem(STORAGE_KEYS.lastLoginAt, now.toISOString());
    } catch {
      /* private mode */
    }
  }

  private readStoredLastLogin(): Date | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.lastLoginAt);
      return raw ? new Date(raw) : null;
    } catch {
      return null;
    }
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
