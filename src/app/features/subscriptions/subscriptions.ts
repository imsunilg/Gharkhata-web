import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { SubscriptionSummary } from '../../core/api/models';

@Component({
  selector: 'fem-subscriptions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrCurrencyPipe],
  template: `
    <h1>Subscriptions</h1>
    @if (data(); as d) {
      <p class="total">{{ d.monthlyTotal | inr }} / month · {{ d.annualisedTotal | inr }} projected this year</p>
      @if (!d.items?.length) {
        <div class="empty"><p>No active subscriptions.</p></div>
      } @else {
        <ul class="list">
          @for (s of d.items ?? []; track s.id) {
            <li>
              <div class="main">
                <span class="nm">{{ s.name }}</span>
                <span class="muted">{{ s.plan }} · {{ s.billingCycle }}</span>
              </div>
              <span class="amt">{{ s.amount | inr }}</span>
              <span class="tag" [class.soon]="soon(s.nextRenewalDate)">
                {{ s.nextRenewalDate | date: 'dd MMM' }}
              </span>
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
      h1 { font-size: 1.6rem; margin: 0 0 6px; }
      .total { color: var(--text-secondary); margin: 0 0 16px; font-size: 0.9rem; }
      .muted { color: var(--text-tertiary); }
      .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      li { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; }
      .main { flex: 1; display: flex; flex-direction: column; }
      .amt { font-variant-numeric: tabular-nums; }
      .tag { font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border); }
      .tag.soon { color: var(--negative); border-color: var(--negative); }
      .empty { text-align: center; padding: 40px 0; border: 1px dashed var(--border); border-radius: var(--radius-md); }
    `,
  ],
})
export class SubscriptionsPage {
  private readonly api = inject(ApiService);
  protected readonly data = signal<SubscriptionSummary | null>(null);

  constructor() {
    void firstValueFrom(this.api.subscriptions()).then((d) => this.data.set(d));
  }
  protected soon(date?: string) {
    if (!date) return false;
    return (new Date(date).getTime() - Date.now()) / 86400000 <= 3;
  }
}
