import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'fem-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="host" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class]="t.kind">
          <span>{{ t.text }}</span>
          @if (t.action) {
            <button type="button" (click)="run(t.action.run, t.id)">{{ t.action.label }}</button>
          }
          <button type="button" class="x" aria-label="Dismiss" (click)="toasts.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .host {
        position: fixed;
        left: 50%;
        bottom: 84px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 2000;
        width: min(440px, calc(100vw - 32px));
      }
      @media (min-width: 980px) {
        .host { bottom: 24px; }
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: var(--radius-md);
        background: var(--surface-raised);
        border: 1px solid var(--border);
        color: var(--text-primary);
        box-shadow: var(--shadow-sheet);
        font-size: 0.9rem;
      }
      .toast.error { border-color: var(--negative); }
      .toast.success { border-color: var(--positive); }
      .toast span { flex: 1; }
      .toast button {
        background: none;
        border: none;
        color: var(--accent-strong);
        font-weight: 600;
        padding: 4px 8px;
      }
      .toast .x { color: var(--text-tertiary); font-size: 1.1rem; }
    `,
  ],
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
  protected run(fn: () => void, id: number) {
    fn();
    this.toasts.dismiss(id);
  }
}
