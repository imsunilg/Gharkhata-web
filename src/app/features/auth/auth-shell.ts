import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'fem-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      <div class="card">
        <div class="brand"><span class="mark">₹</span></div>
        <h1>{{ heading() }}</h1>
        @if (sub()) {
          <p class="sub">{{ sub() }}</p>
        }
        <ng-content />
      </div>
    </main>
  `,
  styles: [
    `
      .wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        width: min(420px, 100%);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 32px;
      }
      .brand {
        display: flex;
        justify-content: center;
        margin-bottom: 18px;
      }
      .mark {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--accent);
        color: #14161c;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 600;
      }
      h1 {
        text-align: center;
        font-size: 1.5rem;
        margin: 0 0 6px;
      }
      .sub {
        text-align: center;
        color: var(--text-secondary);
        margin: 0 0 20px;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class AuthShell {
  readonly heading = input('');
  readonly sub = input('');
}
