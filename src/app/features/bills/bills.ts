import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickAddService } from '../quick-add/quick-add.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { BillDto } from '../../core/api/models';

@Component({
  selector: 'fem-bills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrCurrencyPipe],
  template: `
    <h1>Bills</h1>
    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (!items().length) {
      <div class="empty"><p>No bills tracked.</p></div>
    } @else {
      <ul class="list">
        @for (b of items(); track b.id) {
          <li>
            <div class="main">
              <span class="nm">{{ b.name }}</span>
              <span class="muted">{{ b.payee }}</span>
            </div>
            <span class="amt">{{ b.amount | inr }}</span>
            <span class="tag" [attr.data-status]="b.status">
              @if (b.status === 'Paid') {
                Paid {{ b.lastPaidOn | date: 'dd MMM' }}
              } @else {
                {{ b.dueDate | date: 'dd MMM' }}
              }
            </span>
            @if (b.status !== 'Paid') {
              <button type="button" (click)="pay(b)">Mark paid</button>
            }
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      h1 { font-size: 1.6rem; margin: 0 0 14px; }
      .muted { color: var(--text-tertiary); }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      li {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 12px 14px;
      }
      .main { flex: 1; display: flex; flex-direction: column; }
      .amt { font-variant-numeric: tabular-nums; }
      .tag { font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border); }
      .tag[data-status='Overdue'], .tag[data-status='DueSoon'] { color: var(--negative); border-color: var(--negative); }
      .tag[data-status='Paid'] { color: var(--positive); border-color: var(--positive); }
      button { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); font-size: 0.8rem; }
      .empty { text-align: center; padding: 40px 0; border: 1px dashed var(--border); border-radius: var(--radius-md); }
    `,
  ],
})
export class BillsPage {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly quickAdd = inject(QuickAddService);
  protected readonly items = signal<BillDto[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  protected async pay(b: BillDto) {
    const amount = b.isVariable ? Number(prompt(`Actual amount for ${b.name}?`, String(b.amount)) ?? b.amount) : null;
    try {
      await firstValueFrom(this.api.post(`/bills/${b.id}/pay`, { actualAmount: amount, createExpense: true }));
      this.toast.success(`${b.name} marked paid`);
      this.quickAdd.notifyChanged();
      await this.load();
    } catch (e) {
      this.toast.error((e as { userMessage?: string })?.userMessage ?? 'Could not mark paid.');
    }
  }

  private async load() {
    try {
      this.items.set(await firstValueFrom(this.api.bills()));
    } finally {
      this.loading.set(false);
    }
  }
}
