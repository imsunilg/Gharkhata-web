import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { QuickAddService } from './quick-add.service';

/** Placeholder — the five-second capture flow is built in Step 24. */
@Component({
  selector: 'fem-quick-add-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (quickAdd.isOpen()) {
      <div class="backdrop">
        <button type="button" class="scrim" aria-label="Close" (click)="quickAdd.close()"></button>
        <div class="sheet" role="dialog" aria-modal="true" (keydown.escape)="quickAdd.close()">
          <h2>Quick Add</h2>
          <p>Coming in Step 24.</p>
          <button type="button" (click)="quickAdd.close()">Close</button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .scrim {
        position: absolute;
        inset: 0;
        border: none;
        background: rgba(0, 0, 0, 0.55);
      }
      .sheet {
        position: relative;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 24px;
        width: min(440px, calc(100vw - 32px));
      }
      @media (max-width: 640px) {
        .backdrop { align-items: flex-end; }
        .sheet { border-radius: 18px 18px 0 0; width: 100%; }
      }
      button {
        margin-top: 12px;
        height: 44px;
        padding: 0 18px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface-raised);
        color: var(--text-primary);
      }
    `,
  ],
})
export class QuickAddSheet {
  protected readonly quickAdd = inject(QuickAddService);
}
