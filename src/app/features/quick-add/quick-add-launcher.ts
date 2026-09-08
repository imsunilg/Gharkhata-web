import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { QuickAddService } from './quick-add.service';

@Component({
  selector: 'fem-quick-add-launcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'fab') {
      <button type="button" class="fab" (click)="open()" aria-label="Add expense">+</button>
    } @else {
      <button type="button" class="btn" (click)="open()">+ Add Expense</button>
    }
  `,
  styles: [
    `
      .fab {
        position: fixed;
        left: 50%;
        bottom: 34px;
        transform: translateX(-50%);
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: var(--accent);
        color: #14161c;
        font-size: 1.8rem;
        line-height: 1;
        z-index: 30;
        box-shadow: var(--shadow-fab);
      }
      .btn {
        height: 40px;
        padding: 0 16px;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #14161c;
        font-weight: 600;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class QuickAddLauncher {
  readonly variant = input<'fab' | 'button'>('button');
  private readonly quickAdd = inject(QuickAddService);
  protected open() {
    this.quickAdd.open();
  }
}
