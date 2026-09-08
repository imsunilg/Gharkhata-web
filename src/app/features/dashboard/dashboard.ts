import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { QuickAddService } from '../quick-add/quick-add.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { DonutChart } from '../../shared/components/donut-chart';
import { BarList } from '../../shared/components/bar-list';
import type { DashboardSummaryResponse, InsightDto } from '../../core/api/models';

@Component({
  selector: 'fem-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrCurrencyPipe, DonutChart, BarList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly quickAdd = inject(QuickAddService);

  protected readonly data = signal<DashboardSummaryResponse | null>(null);
  protected readonly loading = signal(true);

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    return `Good ${part}, ${this.auth.user()?.displayName ?? 'there'}`;
  });

  protected readonly donut = computed(() =>
    (this.data()?.categoryBreakdown ?? []).map((c) => ({
      label: c.name ?? '',
      value: c.amount ?? 0,
      colour: c.colour ?? 'var(--cat-other)',
    })),
  );
  protected readonly memberBars = computed(() =>
    (this.data()?.memberBreakdown ?? []).map((m) => ({ label: m.name ?? '', value: m.amount ?? 0 })),
  );
  protected readonly insights = computed(() => (this.data()?.insights ?? []) as InsightDto[]);

  constructor() {
    effect(() => {
      this.quickAdd.changeTick();
      void this.load();
    });
  }

  protected expenseDelta(): { text: string; bad: boolean } | null {
    const pct = this.data()?.summary?.comparison?.expenseChangePct;
    if (pct === undefined || pct === null || pct === 0) return null;
    // For EXPENSES an increase is bad (red).
    return { text: `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs last month`, bad: pct > 0 };
  }
  protected savingsDelta(): { text: string; bad: boolean } | null {
    const pct = this.data()?.summary?.comparison?.savingsChangePct;
    if (pct === undefined || pct === null || pct === 0) return null;
    // For SAVINGS an increase is good (green).
    return { text: `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs last month`, bad: pct < 0 };
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.data.set(await firstValueFrom(this.api.dashboard()));
    } finally {
      this.loading.set(false);
    }
  }

  protected sev(s: string): string {
    return s === 'warning' ? '⚠' : s === 'good' ? '✓' : 'ℹ';
  }
}
