import { Injectable, signal } from '@angular/core';

/** Shared open/close state for the Quick Add sheet (built in Step 24). */
@Injectable({ providedIn: 'root' })
export class QuickAddService {
  readonly isOpen = signal(false);
  readonly seed = signal<string>('');

  open(seed = '') {
    this.seed.set(seed);
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
  }
}
