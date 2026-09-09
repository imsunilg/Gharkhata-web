import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../../core/config';
import type {
  AdminAuditEntryPagedResult,
  AdminDashboardResponse,
  AdminFamilyListItem,
  AdminUserDetail,
  AdminUserListItemPagedResult,
  ChangeUserRoleRequest,
  CreateUserRequest,
  UpdateUserRequest,
} from '../../core/api/models';

/** Thin wrapper over /api/v1/admin — reuses the shared HttpClient + interceptors. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/admin`;

  private params(obj: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  dashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.base}/dashboard`);
  }

  users(query: Record<string, unknown>): Observable<AdminUserListItemPagedResult> {
    return this.http.get<AdminUserListItemPagedResult>(`${this.base}/users`, { params: this.params(query) });
  }

  user(id: string): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.base}/users/${id}`);
  }

  families(): Observable<AdminFamilyListItem[]> {
    return this.http.get<AdminFamilyListItem[]>(`${this.base}/families`);
  }

  auditLogs(query: Record<string, unknown>): Observable<AdminAuditEntryPagedResult> {
    return this.http.get<AdminAuditEntryPagedResult>(`${this.base}/audit-logs`, { params: this.params(query) });
  }

  // ---- mutations (server enforces every guardrail + writes the audit row) ----

  createUser(body: CreateUserRequest): Observable<AdminUserDetail> {
    return this.http.post<AdminUserDetail>(`${this.base}/users`, body);
  }

  updateUser(id: string, body: UpdateUserRequest): Observable<AdminUserDetail> {
    return this.http.put<AdminUserDetail>(`${this.base}/users/${id}`, body);
  }

  activate(id: string): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.base}/users/${id}/activate`, {});
  }

  deactivate(id: string): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.base}/users/${id}/deactivate`, {});
  }

  suspend(id: string, reason: string | null): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.base}/users/${id}/suspend`, { reason });
  }

  restore(id: string): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.base}/users/${id}/restore`, {});
  }

  changeRole(id: string, body: ChangeUserRoleRequest): Observable<AdminUserDetail> {
    return this.http.patch<AdminUserDetail>(`${this.base}/users/${id}/role`, body);
  }

  resetPassword(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/reset-password`, {});
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }
}
