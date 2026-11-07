import { describe, it, expect } from 'vitest';
import { deriveTopUpConfirmation } from './topup-status';

const T0 = Date.parse('2026-11-07T10:00:00Z');
const topup = (iso: string) => ({ type: 'TOPUP', createdAt: iso });

describe('deriveTopUpConfirmation', () => {
  it('is confirming right after the return with no new TOPUP', () => {
    expect(deriveTopUpConfirmation({ returnedAtMs: T0, nowMs: T0 + 2000, transactions: [] })).toBe('confirming');
  });

  it('ignores old TOPUPs and DEBITs', () => {
    const transactions = [topup('2026-11-06T10:00:00Z'), { type: 'DEBIT', createdAt: '2026-11-07T10:00:05Z' }];
    expect(deriveTopUpConfirmation({ returnedAtMs: T0, nowMs: T0 + 2000, transactions })).toBe('confirming');
  });

  it('is confirmed when a TOPUP appears after the return', () => {
    expect(
      deriveTopUpConfirmation({ returnedAtMs: T0, nowMs: T0 + 4000, transactions: [topup('2026-11-07T10:00:03Z')] }),
    ).toBe('confirmed');
  });

  it('counts a TOPUP credited by a webhook just before the redirect landed', () => {
    expect(
      deriveTopUpConfirmation({ returnedAtMs: T0, nowMs: T0 + 1000, transactions: [topup('2026-11-07T09:59:58Z')] }),
    ).toBe('confirmed');
  });

  it('is delayed after 30s without a TOPUP', () => {
    expect(deriveTopUpConfirmation({ returnedAtMs: T0, nowMs: T0 + 30_000, transactions: [] })).toBe('delayed');
  });

  it('confirmed wins over the timeout', () => {
    expect(
      deriveTopUpConfirmation({ returnedAtMs: T0, nowMs: T0 + 60_000, transactions: [topup('2026-11-07T10:00:40Z')] }),
    ).toBe('confirmed');
  });
});
