import { describe, expect, it } from 'vitest';
import { InrCurrencyPipe } from './inr-currency.pipe';

const pipe = new InrCurrencyPipe();

describe('InrCurrencyPipe', () => {
  it.each([
    [450, '₹450'],
    [78450, '₹78,450'],
    [120000, '₹1,20,000'],
    [2852000, '₹28,52,000'],
    [10000000, '₹1,00,00,000'],
    [0, '₹0'],
    [-200, '-₹200'],
    [1234.5, '₹1,234.50'],
  ])('formats %d as %s', (input, expected) => {
    expect(pipe.transform(input)).toBe(expected);
  });

  it('omits the symbol when asked', () => {
    expect(pipe.transform(120000, false)).toBe('1,20,000');
  });
});
