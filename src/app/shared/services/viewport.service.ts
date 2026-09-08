import { Injectable, signal } from '@angular/core';

/** Single source of truth for the 980px shell breakpoint and the 640px sheet breakpoint. */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly _width = signal(typeof window !== 'undefined' ? window.innerWidth : 1440);
  readonly width = this._width.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this._width.set(window.innerWidth), { passive: true });
    }
  }

  readonly isDesktop = () => this._width() >= 980;
  readonly isMobile = () => this._width() < 980;
  readonly asSheet = () => this._width() < 640;
}
