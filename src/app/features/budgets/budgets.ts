import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ReferenceDataStore } from '../../core/state/reference-data.store';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { BudgetProgressDto } from '../../core/api/models';

@Component({
  selector: 'fem-budgets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrCurrencyPipe],
  template: `
    <h1>Budgets</h1>
    @if (loading()) {
      <p class="muted">Loading…</p>
    } @else if (!items().length) {
      <div class="empty"><p>No budgets yet.</p><p class="muted">Set a ceiling and we'll track it.</p></div>
    } @else {
      <div class="grid">
        @for (b of items(); track b.id) {
          <article class="card" [attr.data-state]="b.state">
            <header>
              <span class="nm">{{ b.name }}</span>
              <span class="pct">{{ b.percentUsed }}%</span>
            </header>
            <div class="track"><div class="fill" [style.width.%]="cap(b.percentUsed ?? 0)"></div></div>
            <footer>
              <span>Spent {{ b.spent | inr }}</span>
              @if ((b.overspend ?? 0) > 0) {
                <span class="over">Over by {{ b.overspend | inr }}</span>
              } @else {
                <span class="muted">{{ b.remaining | inr }} left</span>
              }
            </footer>
          </article>
        }
      </div>
    }
  `,
  styles: [
    `
      h1 { font-size: 1.6rem; margin: 0 0 14px; }
      .muted { color: var(--text-tertiary); }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
      header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; }
      .track { height: 8px; border-radius: 4px; background: var(--surface-raised); overflow: hidden; }
      .fill { height: 100%; background: var(--positive); }
      .card[data-state='Warning'] .fill, .card[data-state='Critical'] .fill { background: var(--accent); }
      .card[data-state='Exceeded'] .fill { background: var(--negative); }
      footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.8rem; }
      .over { color: var(--negative); font-weight: 600; }
      .empty { text-align: center; padding: 40px 0; border: 1px dashed var(--border); border-radius: var(--radius-md); }
    `,
  ],
})
export class BudgetsPage {
  private readonly api = inject(ApiService);
  protected readonly reference = inject(ReferenceDataStore);
  protected readonly items = signal<BudgetProgressDto[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    void this.load();
  }
  protected cap(n: number) {
    return Math.min(100, n);
  }
  private async load() {
    try {
      this.items.set(await firstValueFrom(this.api.budgetsCurrent()));
    } finally {
      this.loading.set(false);
    }
  }
}
