import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
  action?: { label: string; run: () => void };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  info(text: string) {
    this.push(text, 'info');
  }
  success(text: string) {
    this.push(text, 'success');
  }
  error(text: string) {
    this.push(text, 'error', 6000);
  }

  withUndo(text: string, undo: () => void, ms = 5000): number {
    return this.push(text, 'success', ms, { label: 'Undo', run: undo });
  }

  dismiss(id: number) {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(text: string, kind: Toast['kind'], ms = 3500, action?: Toast['action']): number {
    const id = ++this.seq;
    this._toasts.update((list) => [...list, { id, text, kind, action }]);
    if (ms > 0) setTimeout(() => this.dismiss(id), ms);
    return id;
  }
}
