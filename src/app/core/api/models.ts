import type { components } from './generated/schema';

type S = components['schemas'];

export type AuthResponse = S['AuthResponse'];
export type MeResponse = S['MeResponse'];
export type CreateFamilyResponse = S['CreateFamilyResponse'];
export type FamilyResponse = S['FamilyResponse'];
export type MemberResponse = S['MemberResponse'];
export type ReferenceDataResponse = S['ReferenceDataResponse'];
export type CategoryDto = S['CategoryDto'];
export type SubCategoryDto = S['SubCategoryDto'];
export type AccountDto = S['AccountDto'];
export type MemberDto = S['MemberDto'];
export type ExpenseDto = S['ExpenseDto'];
export type ExpenseHistoryDto = S['ExpenseHistoryDto'];
export type CreateExpenseRequest = S['CreateExpenseRequest'];
export type UpdateExpenseRequest = S['UpdateExpenseRequest'];
export type DashboardSummaryResponse = S['DashboardSummaryResponse'];
export type BudgetDto = S['BudgetDto'];
export type BudgetProgressDto = S['BudgetProgressDto'];
export type BillDto = S['BillDto'];
export type SubscriptionSummary = S['SubscriptionSummary'];
export type RecurringExpenseDto = S['RecurringExpenseDto'];
export type GoalDto = S['GoalDto'];
export type DebtSummary = S['DebtSummary'];
export type IncomeDto = S['IncomeDto'];
export type InsightDto = S['InsightDto'];
export type NotificationDto = S['NotificationDto'];
export type ReportResponse = S['ReportResponse'];
export type MonthlyReviewResponse = S['MonthlyReviewResponse'];

export type AdminDashboardResponse = S['AdminDashboardResponse'];
export type AdminUserListItem = S['AdminUserListItem'];
export type AdminUserDetail = S['AdminUserDetail'];
export type AdminAuditEntry = S['AdminAuditEntry'];
export type AdminFamilyListItem = S['AdminFamilyListItem'];
export type AdminUserListItemPagedResult = S['AdminUserListItemPagedResult'];
export type AdminAuditEntryPagedResult = S['AdminAuditEntryPagedResult'];

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
}
