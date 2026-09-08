import { Pipe, PipeTransform } from '@angular/core';

/** Indian digit grouping: ₹1,20,000 — not ₹120,000. */
@Pipe({ name: 'inr' })
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, withSymbol = true): string {
    if (value === null || value === undefined || value === '') return withSymbol ? '₹0' : '0';
    const num = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(num)) return withSymbol ? '₹0' : '0';

    const negative = num < 0;
    const [intPart, fracPart] = Math.abs(num).toFixed(2).split('.');
    const grouped = this.group(intPart);
    const frac = fracPart === '00' ? '' : '.' + fracPart;
    const sign = negative ? '-' : '';
    return `${sign}${withSymbol ? '₹' : ''}${grouped}${frac}`;
  }

  private group(s: string): string {
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
}
