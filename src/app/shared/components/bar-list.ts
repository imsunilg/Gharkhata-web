import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { InrCurrencyPipe } from '../pipes/inr-currency.pipe';

export interface BarItem {
  label: string;
  value: number;
  colour?: string;
}

@Component({
  selector: 'fem-bar-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InrCurrencyPipe],
  template: `
    @if (items().length) {
      <ul>
        @for (row of rows(); track row.label) {
          <li>
            <div class="head">
              <span>{{ row.label }}</span>
              <span class="v">{{ row.value | inr }}</span>
            </div>
            <div class="track">
              <div class="fill" [style.width.%]="row.pct" [style.background]="row.colour"></div>
            </div>
          </li>
        }
      </ul>
    } @else {
      <p class="empty">Nothing to show yet.</p>
    }
  `,
  styles: [
    `
      ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
      .head { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; }
      .v { font-variant-numeric: tabular-nums; }
      .track { height: 8px; border-radius: 4px; background: var(--surface-raised); overflow: hidden; }
      .fill { height: 100%; border-radius: 4px; background: var(--accent); }
      .empty { color: var(--text-tertiary); }
    `,
  ],
})
export class BarList {
  readonly items = input<BarItem[]>([]);

  protected readonly rows = computed(() => {
    const max = Math.max(1, ...this.items().map((i) => i.value));
    return this.items().map((i) => ({
      ...i,
      pct: Math.round((i.value / max) * 100),
      colour: i.colour ?? 'var(--accent)',
    }));
  });
}
