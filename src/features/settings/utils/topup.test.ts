import { describe, it, expect } from 'vitest';
import { topUpPresets, parseReaisToCents, validateTopUp } from './topup';

describe('topUpPresets', () => {
  it('offers 50/100/200/500 reais when the minimum is R$ 50', () => {
    expect(topUpPresets(5000)).toEqual([5000, 10000, 20000, 50000]);
  });

  it('drops presets below the minimum', () => {
    expect(topUpPresets(15000)).toEqual([20000, 50000]);
  });

  it('falls back to the minimum when it exceeds every preset', () => {
    expect(topUpPresets(80000)).toEqual([80000]);
  });
});

describe('parseReaisToCents', () => {
  it.each([
    ['200', 20000],
    ['200,50', 20050],
    ['200.5', 20050],
    [' 50 ', 5000],
  ])('parses %s', (input, cents) => expect(parseReaisToCents(input)).toBe(cents));

  it.each(['', 'abc', '0', '-5'])('rejects %j', (input) => expect(parseReaisToCents(input)).toBeNull());
});

describe('validateTopUp', () => {
  it('accepts the exact minimum', () => {
    expect(validateTopUp('50,00', 5000)).toEqual({ ok: true, cents: 5000 });
  });

  it('rejects values below the minimum', () => {
    expect(validateTopUp('49,99', 5000)).toEqual({ ok: false, reason: 'belowMin' });
  });

  it('rejects garbage', () => {
    expect(validateTopUp('x', 5000)).toEqual({ ok: false, reason: 'invalid' });
  });
});
