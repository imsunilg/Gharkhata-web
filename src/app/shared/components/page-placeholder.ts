import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'fem-page-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h1>{{ title() }}</h1>
      <p>This screen is scaffolded. Full UI lands in a later step.</p>
    </section>
  `,
  styles: [
    `
      section { padding: 8px 0; }
      h1 { font-size: 1.6rem; margin: 0 0 6px; }
      p { color: var(--text-secondary); }
    `,
  ],
})
export class PagePlaceholder {
  readonly title = input('Page');
}
