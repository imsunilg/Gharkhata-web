import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Centered modal dialog frame — scrim, Escape / backdrop close, focus handling.
 * Content and action buttons are projected; the host owns the busy state.
 */
@Component({
  selector: 'fem-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="scrim" aria-label="Close dialog" (click)="dismiss()"></button>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      tabindex="-1"
      (keydown.escape)="dismiss()"
    >
      <h3 [id]="titleId">{{ title() }}</h3>
      <div class="body">
        <ng-content />
      </div>
      <div class="actions">
        <ng-content select="[modalActions]" />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: 16px;
      }
      .scrim {
        position: absolute;
        inset: 0;
        border: none;
        padding: 0;
        background: rgba(0, 0, 0, 0.55);
        cursor: default;
      }
      .dialog {
        position: relative;
        width: 100%;
        max-width: 440px;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sheet);
        padding: 20px;
      }
      h3 { margin: 0 0 14px; font-size: 1.05rem; }
      .body { display: flex; flex-direction: column; gap: 12px; }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 18px;
      }
    `,
  ],
})
export class Modal implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly title = input.required<string>();
  /** Emitted on scrim click / Escape. The host decides whether to actually close. */
  readonly closed = output<void>();

  protected readonly titleId = `modal-${Math.random().toString(36).slice(2, 9)}`;

  /** Set by the host while a request is in flight to block dismiss. */
  busy = false;

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      const focusable = this.host.nativeElement.querySelector<HTMLElement>(
        '.dialog input, .dialog select, .dialog textarea, .dialog button',
      );
      focusable?.focus();
    });
  }

  protected dismiss(): void {
    if (!this.busy) this.closed.emit();
  }
}
