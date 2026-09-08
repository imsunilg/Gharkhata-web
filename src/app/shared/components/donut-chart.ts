import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InrCurrencyPipe } from '../pipes/inr-currency.pipe';

export interface DonutSlice {
  label: string;
  value: number;
  colour: string;
}

@Component({
  selector: 'fem-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrCurrencyPipe],
  template: `
    @if (total() > 0) {
      <div class="wrap">
        <svg viewBox="0 0 42 42" role="img" [attr.aria-label]="alt()">
          <circle class="track" cx="21" cy="21" r="15.915" />
          @for (seg of segments(); track seg.label) {
            <circle
              class="seg"
              cx="21"
              cy="21"
              r="15.915"
              [attr.stroke]="seg.colour"
              [attr.stroke-dasharray]="seg.dash"
              [attr.stroke-dashoffset]="seg.offset"
            />
          }
          <text x="21" y="20" class="v">{{ total() | inr }}</text>
          <text x="21" y="25" class="l">this month</text>
        </svg>
        <ul class="legend">
          @for (seg of segments(); track seg.label) {
            <li>
              <span class="dot" [style.background]="seg.colour"></span>
              <span class="nm">{{ seg.label }}</span>
              <span class="amt">{{ seg.value | inr }}</span>
              <span class="pct">{{ seg.pct }}%</span>
            </li>
          }
        </ul>
      </div>
    } @else {
      <p class="empty">No spending recorded yet.</p>
    }
  `,
  styles: [
    `
      .wrap { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
      svg { width: 150px; height: 150px; flex-shrink: 0; transform: rotate(-90deg); }
      .track { fill: none; stroke: var(--surface-raised); stroke-width: 4; }
      .seg { fill: none; stroke-width: 4; stroke-linecap: butt; }
      text { transform: rotate(90deg); transform-origin: 21px 21px; text-anchor: middle; }
      .v { font-size: 4px; fill: var(--text-primary); font-family: var(--font-display); }
      .l { font-size: 2.4px; fill: var(--text-tertiary); }
      .legend { list-style: none; margin: 0; padding: 0; flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 7px; }
      .legend li { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
      .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      .nm { flex: 1; }
      .amt { font-variant-numeric: tabular-nums; }
      .pct { color: var(--text-tertiary); width: 40px; text-align: right; }
      .empty { color: var(--text-tertiary); padding: 20px 0; }
    `,
  ],
})
export class DonutChart {
  readonly data = input<DonutSlice[]>([]);

  protected readonly total = computed(() => this.data().reduce((s, d) => s + d.value, 0));

  protected readonly segments = computed(() => {
    const total = this.total();
    let acc = 0;
    return this.data()
      .filter((d) => d.value > 0)
      .map((d) => {
        const pct = Math.round((d.value / total) * 100);
        const len = (d.value / total) * 100;
        const seg = { ...d, pct, dash: `${len} ${100 - len}`, offset: -acc };
        acc += len;
        return seg;
      });
  });

  protected readonly alt = computed(() =>
    'Spending by category: ' +
    this.segments().map((s) => `${s.label} ${s.pct} percent`).join(', '),
  );
}
