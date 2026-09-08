import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fem-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="home">
      <div class="brand">₹</div>
      <h1>Ghar Khata</h1>
      <p class="tag">Know where your family's money is going.</p>
      <p class="hint">Scaffold ready — shell and features land in later steps.</p>
    </main>
  `,
  styles: [
    `
      .home {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        text-align: center;
        padding: 2rem;
      }
      .brand {
        width: 64px;
        height: 64px;
        display: grid;
        place-items: center;
        border-radius: var(--radius-md);
        background: var(--accent);
        color: #14161c;
        font-family: var(--font-display);
        font-size: 34px;
        font-weight: 600;
      }
      h1 {
        margin: 0.75rem 0 0;
        font-size: 2rem;
      }
      .tag {
        color: var(--text-secondary);
        margin: 0;
      }
      .hint {
        color: var(--text-tertiary);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class Home {}
