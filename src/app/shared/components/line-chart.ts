import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface LineSeries {
  label: string;
  colour: string;
  points: { x: string; y: number }[];
}

@Component({
  selector: 'fem-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasData()) {
      <svg viewBox="0 0 300 140" role="img" [attr.aria-label]="alt()">
        @for (s of scaled(); track s.label) {
          <polyline [attr.points]="s.path" [attr.stroke]="s.colour" fill="none" stroke-width="2" />
        }
        <line x1="0" y1="120" x2="300" y2="120" stroke="var(--border)" />
      </svg>
      <div class="labels">
        @for (l of xLabels(); track l) {<span>{{ l }}</span>}
      </div>
      <div class="legend">
        @for (s of series(); track s.label) {
          <span><i [style.background]="s.colour"></i>{{ s.label }}</span>
        }
      </div>
    } @else {
      <p class="empty">Not enough data yet.</p>
    }
  `,
  styles: [
    `
      svg { width: 100%; height: auto; }
      .labels { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-tertiary); margin-top: 4px; }
      .legend { display: flex; gap: 14px; margin-top: 8px; font-size: 0.78rem; }
      .legend i { display: inline-block; width: 10px; height: 3px; margin-right: 5px; vertical-align: middle; }
      .empty { color: var(--text-tertiary); }
    `,
  ],
})
export class LineChart {
  readonly series = input<LineSeries[]>([]);

  protected readonly hasData = computed(() => this.series().some((s) => s.points.length > 1));

  private readonly bounds = computed(() => {
    const all = this.series().flatMap((s) => s.points.map((p) => p.y));
    if (!all.length) return { min: 0, max: 1 };
    const min = Math.min(...all);
    const max = Math.max(...all);
    // Data-relative baseline — NOT zero — so variation is visible.
    const pad = (max - min) * 0.15 || max * 0.1 || 1;
    return { min: Math.max(0, min - pad), max: max + pad };
  });

  protected readonly scaled = computed(() => {
    const { min, max } = this.bounds();
    const span = max - min || 1;
    return this.series().map((s) => {
      const n = s.points.length;
      const path = s.points
        .map((p, i) => {
          const x = n === 1 ? 0 : (i / (n - 1)) * 300;
          const y = 120 - ((p.y - min) / span) * 110;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
      return { ...s, path };
    });
  });

  protected readonly xLabels = computed(() => {
    const first = this.series()[0]?.points ?? [];
    return first.map((p) => p.x);
  });

  protected readonly alt = computed(() =>
    this.series()
      .map((s) => `${s.label}: ${s.points.map((p) => Math.round(p.y)).join(', ')}`)
      .join('. '),
  );
}
