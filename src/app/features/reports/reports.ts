import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { LineChart, type LineSeries } from '../../shared/components/line-chart';
import { BarList } from '../../shared/components/bar-list';
import type { MonthlyReviewResponse, ReportResponse } from '../../core/api/models';

@Component({
  selector: 'fem-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrCurrencyPipe, LineChart, BarList],
  template: `
    <header class="head">
      <h1>Reports</h1>
      <select [value]="range()" (change)="setRange($any($event.target).value)" aria-label="Range">
        <option value="3">Last 3 months</option>
        <option value="6">Last 6 months</option>
        <option value="12">Last 12 months</option>
      </select>
    </header>

    <section class="panel">
      <h2>Income vs expenses</h2>
      <fem-line-chart [series]="ivsE()" />
    </section>

    <section class="panel">
      <h2>Spend by category</h2>
      <fem-bar-list [items]="categoryBars()" />
    </section>

    <section class="panel">
      <h2>Member spending</h2>
      <fem-bar-list [items]="memberBars()" />
    </section>

    @if (review(); as r) {
      <section class="panel review">
        <h2>{{ r.month }} review</h2>
        <dl>
          <div><dt>Top category</dt><dd>{{ r.topCategory ?? '—' }}</dd></div>
          <div><dt>Highest single expense</dt><dd>{{ r.highestSingleExpense | inr }}</dd></div>
          <div><dt>Largest increase</dt><dd>{{ r.largestCategoryIncrease ?? '—' }}</dd></div>
          <div><dt>Savings rate</dt><dd>{{ r.savingsRate }}%</dd></div>
        </dl>
      </section>
    }
  `,
  styles: [
    `
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      h1 { font-size: 1.6rem; margin: 0; }
      select { height: 38px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); padding: 0 14px; }
      .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 14px; }
      .panel h2 { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 12px; }
      dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      dl > div { display: flex; flex-direction: column; }
      dt { color: var(--text-tertiary); font-size: 0.75rem; }
      dd { margin: 0; font-family: var(--font-display); }
    `,
  ],
})
export class ReportsPage {
  private readonly api = inject(ApiService);

  protected readonly range = signal('6');
  protected readonly ive = signal<ReportResponse | null>(null);
  protected readonly category = signal<ReportResponse | null>(null);
  protected readonly member = signal<ReportResponse | null>(null);
  protected readonly review = signal<MonthlyReviewResponse | null>(null);

  protected readonly ivsE = computed<LineSeries[]>(() => {
    const series = this.ive()?.series ?? [];
    const income = series.filter((p) => (p.label ?? '').includes('income'));
    const expense = series.filter((p) => (p.label ?? '').includes('expense'));
    return [
      { label: 'Income', colour: 'var(--positive)', points: income.map((p) => ({ x: (p.label ?? '').split(' ')[0], y: p.value ?? 0 })) },
      { label: 'Expenses', colour: 'var(--negative)', points: expense.map((p) => ({ x: (p.label ?? '').split(' ')[0], y: p.value ?? 0 })) },
    ];
  });
  protected readonly categoryBars = computed(() =>
    (this.category()?.rows ?? []).map((r) => ({ label: r.label ?? '', value: r.amount ?? 0, colour: r.colour ?? undefined })),
  );
  protected readonly memberBars = computed(() =>
    (this.member()?.rows ?? []).map((r) => ({ label: r.label ?? '', value: r.amount ?? 0 })),
  );

  constructor() {
    void this.load();
  }

  protected setRange(v: string) {
    this.range.set(v);
    void this.load();
  }

  private async load() {
    const months = Number(this.range());
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - (months - 1), 1);
    const f = from.toISOString().slice(0, 10);
    const t = to.toISOString().slice(0, 10);
    const [ive, cat, mem, rev] = await Promise.all([
      firstValueFrom(this.api.report('income-vs-expense', f, t)),
      firstValueFrom(this.api.report('category', f, t)),
      firstValueFrom(this.api.report('member-spending', f, t)),
      firstValueFrom(this.api.monthlyReview()),
    ]);
    this.ive.set(ive);
    this.category.set(cat);
    this.member.set(mem);
    this.review.set(rev);
  }
}
