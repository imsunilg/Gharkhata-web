import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../config';
import type {
  BudgetProgressDto,
  BillDto,
  DashboardSummaryResponse,
  DebtSummary,
  ExpenseDto,
  ExpenseHistoryDto,
  GoalDto,
  IncomeDto,
  InsightDto,
  MonthlyReviewResponse,
  NotificationDto,
  Paged,
  ReportResponse,
  SubscriptionSummary,
} from '../api/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private params(obj: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  dashboard(month?: string): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${API_BASE}/dashboard/summary`, {
      params: this.params({ month }),
    });
  }

  expenses(query: Record<string, unknown>): Observable<Paged<ExpenseDto>> {
    return this.http.get<Paged<ExpenseDto>>(`${API_BASE}/expenses`, { params: this.params(query) });
  }
  expense(id: string): Observable<ExpenseDto> {
    return this.http.get<ExpenseDto>(`${API_BASE}/expenses/${id}`);
  }
  expenseHistory(id: string): Observable<ExpenseHistoryDto[]> {
    return this.http.get<ExpenseHistoryDto[]>(`${API_BASE}/expenses/${id}/history`);
  }
  createExpense(body: unknown, idempotencyKey?: string): Observable<ExpenseDto> {
    return this.http.post<ExpenseDto>(`${API_BASE}/expenses`, body, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    });
  }
  updateExpense(id: string, body: unknown): Observable<ExpenseDto> {
    return this.http.put<ExpenseDto>(`${API_BASE}/expenses/${id}`, body);
  }
  deleteExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/expenses/${id}`);
  }
  search(q: string): Observable<Paged<ExpenseDto>> {
    return this.http.get<Paged<ExpenseDto>>(`${API_BASE}/expenses/search`, { params: this.params({ q }) });
  }

  budgetsCurrent(month?: string): Observable<BudgetProgressDto[]> {
    return this.http.get<BudgetProgressDto[]>(`${API_BASE}/budgets/current`, { params: this.params({ month }) });
  }
  bills(): Observable<BillDto[]> {
    return this.http.get<BillDto[]>(`${API_BASE}/bills`);
  }
  subscriptions(): Observable<SubscriptionSummary> {
    return this.http.get<SubscriptionSummary>(`${API_BASE}/subscriptions`);
  }
  goals(): Observable<GoalDto[]> {
    return this.http.get<GoalDto[]>(`${API_BASE}/savings-goals`);
  }
  debts(): Observable<DebtSummary> {
    return this.http.get<DebtSummary>(`${API_BASE}/debts`);
  }
  income(from?: string, to?: string): Observable<IncomeDto[]> {
    return this.http.get<IncomeDto[]>(`${API_BASE}/income`, { params: this.params({ from, to }) });
  }
  insights(month?: string): Observable<InsightDto[]> {
    return this.http.get<InsightDto[]>(`${API_BASE}/insights`, { params: this.params({ month }) });
  }
  notifications(): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${API_BASE}/notifications`);
  }
  report(type: string, from?: string, to?: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${API_BASE}/reports/${type}`, { params: this.params({ from, to }) });
  }
  monthlyReview(month?: string): Observable<MonthlyReviewResponse> {
    return this.http.get<MonthlyReviewResponse>(`${API_BASE}/reports/monthly-review`, { params: this.params({ month }) });
  }
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${API_BASE}${path}`, body);
  }
}
