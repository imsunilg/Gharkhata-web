import { Injectable, signal } from '@angular/core';

export interface QuickAddDefaults {
  paymentMethod?: string;
  accountId?: string | null;
  paidByMemberId?: string;
}

/** Shared state + change signal for the Quick Add sheet. */
@Injectable({ providedIn: 'root' })
export class QuickAddService {
  readonly isOpen = signal(false);
  readonly seed = signal<string>('');
  readonly prefill = signal<Record<string, unknown> | null>(null);
  /** Bumped whenever an expense is created / changed so lists and the dashboard refetch. */
  readonly changeTick = signal(0);

  open(seed = '', prefill: Record<string, unknown> | null = null) {
    this.seed.set(seed);
    this.prefill.set(prefill);
    this.isOpen.set(true);
  }
  close() {
    this.isOpen.set(false);
    this.seed.set('');
    this.prefill.set(null);
  }
  notifyChanged() {
    this.changeTick.update((n) => n + 1);
  }

  loadDefaults(): QuickAddDefaults {
    try {
      return JSON.parse(localStorage.getItem('ghk.quickAdd.defaults') ?? '{}') as QuickAddDefaults;
    } catch {
      return {};
    }
  }
  saveDefaults(d: QuickAddDefaults) {
    try {
      localStorage.setItem('ghk.quickAdd.defaults', JSON.stringify(d));
    } catch {
      /* private mode */
    }
  }
}
