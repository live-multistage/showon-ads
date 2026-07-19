import { describe, expect, it } from 'vitest';
import { formatCentsToBRL } from './format-currency';

describe('formatCentsToBRL', () => {
  it('converts cents to a BRL currency string', () => {
    expect(formatCentsToBRL(123456)).toBe('R$ 1.234,56');
  });

  it('handles zero', () => {
    expect(formatCentsToBRL(0)).toBe('R$ 0,00');
  });
});
