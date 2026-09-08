import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickAddService } from '../quick-add/quick-add.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { DebtSummary } from '../../core/api/models';

@Component({
  selector: 'fem-debts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrCurrencyPipe],
  template: `
    <h1>Debts &amp; Loans</h1>
    @if (data(); as d) {
      <div class="cards">
        <div class="card"><span class="k">Total outstanding</span><span class="v red">{{ d.totalOutstanding | inr }}</span></div>
        <div class="card"><span class="k">Monthly EMI</span><span class="v">{{ d.totalMonthlyEmi | inr }}</span></div>
        <div class="card"><span class="k">Next payment</span><span class="v">{{ d.nextPaymentDue | date: 'dd MMM' }}</span></div>
      </div>
      @if (!d.items?.length) {
        <div class="empty"><p>No debts recorded.</p></div>
      } @else {
        <ul class="list">
          @for (x of d.items ?? []; track x.id) {
            <li>
              <div class="main">
                <span class="nm">{{ x.type }}</span>
                <span class="muted">{{ x.lender }} · {{ x.interestRate }}% · day {{ x.paymentDayOfMonth }}</span>
              </div>
              <span class="amt">{{ x.outstandingAmount | inr }}</span>
              <span class="tag">EMI {{ x.emiAmount | inr }}</span>
              <button type="button" (click)="payEmi(x.id!)">Pay EMI</button>
            </li>
          }
        </ul>
      }
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
  styles: [
    `
      h1 { font-size: 1.6rem; margin: 0 0 14px; }
      .muted { color: var(--text-tertiary); }
      .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
      @media (max-width: 720px) { .cards { grid-template-columns: 1fr; } }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 4px; }
      .k { font-size: 0.75rem; color: var(--text-secondary); }
      .v { font-family: var(--font-display); font-size: 1.4rem; }
      .v.red { color: var(--negative); }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      li { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; }
      .main { flex: 1; display: flex; flex-direction: column; }
      .amt { font-variant-numeric: tabular-nums; }
      .tag { font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border); color: var(--text-secondary); }
      button { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); font-size: 0.8rem; }
      .empty { text-align: center; padding: 40px 0; border: 1px dashed var(--border); border-radius: var(--radius-md); }
    `,
  ],
})
export class DebtsPage {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly quickAdd = inject(QuickAddService);
  protected readonly data = signal<DebtSummary | null>(null);

  constructor() {
    void this.load();
  }

  protected async payEmi(id: string) {
    try {
      await firstValueFrom(this.api.post(`/debts/${id}/pay-emi`, {}));
      this.toast.success('EMI recorded');
      this.quickAdd.notifyChanged();
      await this.load();
    } catch (e) {
      this.toast.error((e as { userMessage?: string })?.userMessage ?? 'Could not record the EMI.');
    }
  }

  private async load() {
    this.data.set(await firstValueFrom(this.api.debts()));
  }
}
