import { describe, expect, it } from 'vitest';
import { formatCentsToBRL, reaisToCents } from './format-currency';

describe('formatCentsToBRL', () => {
  it('converts cents to a BRL currency string', () => {
    expect(formatCentsToBRL(123456)).toBe('R$ 1.234,56');
  });

  it('handles zero', () => {
    expect(formatCentsToBRL(0)).toBe('R$ 0,00');
  });
});

describe('reaisToCents', () => {
  it('converts a reais string to integer cents', () => {
    expect(reaisToCents('15.5')).toBe(1550);
  });

  it('rounds fractional cents', () => {
    expect(reaisToCents('10.005')).toBe(1001);
  });

  it('treats empty input as 0', () => {
    expect(reaisToCents('')).toBe(0);
  });

  it('treats non-numeric input as 0', () => {
    expect(reaisToCents('abc')).toBe(0);
  });
});
