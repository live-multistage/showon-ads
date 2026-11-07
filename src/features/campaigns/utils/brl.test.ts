import { describe, it, expect } from 'vitest';
import { parseBrl, parseBrlToCents, formatCostPerImpression } from './brl';

describe('parseBrl', () => {
  it.each([
    ['1.500,00', 1500],
    ['1500,00', 1500],
    ['1500', 1500],
    ['200,50', 200.5],
    ['200.5', 200.5],
    ['1.500', 1500],
    ['1.234.567,89', 1234567.89],
    ['R$ 50', 50],
    [' 0,5 ', 0.5],
    ['12', 12],
  ])('parses %s', (input, expected) => expect(parseBrl(input)).toBe(expected));

  it.each(['', '  ', 'abc', '1,2,3', '--5', '12abc', '1.5.5'])('rejects %j', (input) =>
    expect(parseBrl(input)).toBeNull(),
  );
});

describe('parseBrlToCents', () => {
  it('rounds to whole cents', () => {
    expect(parseBrlToCents('10,005')).toBe(1001);
    expect(parseBrlToCents('1.500,00')).toBe(150000);
  });

  it('returns null for invalid input', () => expect(parseBrlToCents('x')).toBeNull());
});

describe('formatCostPerImpression', () => {
  it('shows four decimals', () => {
    expect(formatCostPerImpression(1200)).toMatch(/R\$\s?0,0120/);
    expect(formatCostPerImpression(300)).toMatch(/R\$\s?0,0030/);
    expect(formatCostPerImpression(1400)).toMatch(/R\$\s?0,0140/);
  });
});
