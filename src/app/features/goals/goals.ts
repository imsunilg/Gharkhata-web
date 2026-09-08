import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import type { GoalDto } from '../../core/api/models';

@Component({
  selector: 'fem-goals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, InrCurrencyPipe],
  template: `
    <h1>Savings Goals</h1>
    @if (!items().length && !loading()) {
      <div class="empty"><p>No goals yet.</p></div>
    } @else {
      <div class="grid">
        @for (g of items(); track g.id) {
          <article class="card">
            <header>
              <span class="nm">{{ g.name }}</span>
              <span class="pct">{{ g.percentComplete }}%</span>
            </header>
            <p class="date muted">{{ g.targetDate | date: 'dd MMM yyyy' }}</p>
            <div class="ring">
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle class="t" cx="18" cy="18" r="15.9" />
                <circle class="p" cx="18" cy="18" r="15.9"
                  [attr.stroke-dasharray]="(g.percentComplete ?? 0) + ' 100'" />
              </svg>
            </div>
            <p class="amt">{{ g.currentAmount | inr }} <span class="muted">of {{ g.targetAmount | inr }}</span></p>
            <p class="togo">{{ g.remaining | inr }} to go</p>
            @if (g.offTrack && g.requiredMonthly) {
              <p class="warn">Needs {{ g.requiredMonthly | inr }}/month to catch up</p>
            }
            <button type="button" (click)="contribute(g)">Add contribution</button>
          </article>
        }
      </div>
    }
  `,
  styles: [
    `
      h1 { font-size: 1.6rem; margin: 0 0 14px; }
      .muted { color: var(--text-tertiary); }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; text-align: center; }
      header { display: flex; justify-content: space-between; }
      .nm { font-family: var(--font-display); }
      .date { font-size: 0.75rem; margin: 2px 0 8px; }
      .ring svg { width: 88px; height: 88px; transform: rotate(-90deg); }
      .ring .t { fill: none; stroke: var(--surface-raised); stroke-width: 3; }
      .ring .p { fill: none; stroke: var(--accent); stroke-width: 3; stroke-linecap: round; }
      .amt { margin: 10px 0 2px; font-family: var(--font-display); }
      .togo { color: var(--positive); font-size: 0.85rem; margin: 0 0 8px; }
      .warn { color: var(--negative); font-size: 0.78rem; }
      button { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface-raised); color: var(--text-primary); }
      .empty { text-align: center; padding: 40px 0; border: 1px dashed var(--border); border-radius: var(--radius-md); }
    `,
  ],
})
export class GoalsPage {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  protected readonly items = signal<GoalDto[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  protected async contribute(g: GoalDto) {
    const amount = Number(prompt(`Contribution to ${g.name}?`, '1000') ?? 0);
    if (amount <= 0) return;
    try {
      await firstValueFrom(this.api.post(`/savings-goals/${g.id}/contribute`, { amount }));
      this.toast.success('Contribution recorded');
      await this.load();
    } catch (e) {
      this.toast.error((e as { userMessage?: string })?.userMessage ?? 'Could not record that.');
    }
  }

  private async load() {
    try {
      this.items.set(await firstValueFrom(this.api.goals()));
    } finally {
      this.loading.set(false);
    }
  }
}
