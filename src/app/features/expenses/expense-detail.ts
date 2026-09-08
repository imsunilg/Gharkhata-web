import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';
import { ToastService } from '../../core/services/toast.service';
import { QuickAddService } from '../quick-add/quick-add.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { ExpenseDto, ExpenseHistoryDto } from '../../core/api/models';

@Component({
  selector: 'fem-expense-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrCurrencyPipe],
  templateUrl: './expense-detail.html',
  styleUrl: './expense-detail.scss',
})
export class ExpenseDetail {
  readonly expenseId = input.required<string>();
  readonly closed = output<boolean>();

  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly reference = inject(ReferenceDataStore);
  private readonly toast = inject(ToastService);
  private readonly quickAdd = inject(QuickAddService);

  protected readonly expense = signal<ExpenseDto | null>(null);
  protected readonly history = signal<ExpenseHistoryDto[]>([]);
  private changed = false;

  protected readonly canEdit = computed(() => {
    const e = this.expense();
    const role = this.auth.user()?.role;
    if (!e || role === 'Viewer') return false;
    if (role === 'Owner' || role === 'Admin') return true;
    return e.paidByMemberId === this.auth.user()?.memberId;
  });

  protected readonly categoryColour = computed(
    () => this.reference.categoryById().get(this.expense()?.categoryId ?? '')?.colour ?? 'var(--cat-other)',
  );

  constructor() {
    toObservable(this.expenseId)
      .pipe(switchMap((id) => this.api.expense(id)))
      .subscribe((e) => this.expense.set(e));
    toObservable(this.expenseId)
      .pipe(switchMap((id) => this.api.expenseHistory(id)))
      .subscribe((h) => this.history.set(h));
  }

  protected memberName(id: string): string {
    return this.reference.memberById().get(id)?.displayName ?? 'Member';
  }

  protected close(): void {
    this.closed.emit(this.changed);
  }

  protected edit(): void {
    const e = this.expense();
    if (!e) return;
    this.quickAdd.open('', { amount: e.amount, title: e.title, categoryId: e.categoryId });
    this.close();
  }

  protected async remove(): Promise<void> {
    const e = this.expense();
    if (!e || !confirm('Delete this expense?')) return;
    try {
      await firstValueFrom(this.api.deleteExpense(e.id!));
      this.changed = true;
      this.quickAdd.notifyChanged();
      this.toast.success('Expense deleted');
      this.close();
    } catch (err) {
      this.toast.error((err as { userMessage?: string })?.userMessage ?? 'Could not delete.');
    }
  }
}
