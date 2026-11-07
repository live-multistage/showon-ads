import { describe, it, expect } from 'vitest';
import { deriveDelivery, deliveryLabel, needsAction, type DeliveryContext } from './derive-delivery';

const NOW = new Date('2026-11-07T12:00:00Z');
const ctx = (o: Partial<DeliveryContext> = {}): DeliveryContext => ({
  now: NOW,
  walletBalanceCents: 10_000,
  spentTodayCents: 0,
  ...o,
});
const ad = (o: Record<string, unknown> = {}) => ({
  status: 'ACTIVE' as const,
  format: 'HORIZONTAL_728x90' as const,
  videoUrl: null,
  startsAt: '2026-11-01T00:00:00Z',
  endsAt: '2026-11-30T00:00:00Z',
  dailyBudgetCents: 8000,
  totalLimitCents: 150000,
  totalSpendCents: 1000,
  ...o,
});

describe('deriveDelivery', () => {
  it('active, funded and under budget is delivering', () => {
    expect(deriveDelivery(ad(), ctx())).toBe('ok');
  });

  it('active with an empty wallet is stopped for lack of funds', () => {
    expect(deriveDelivery(ad(), ctx({ walletBalanceCents: 0 }))).toBe('nofunds');
  });

  it('does not claim "sem saldo" while the balance is unknown', () => {
    expect(deriveDelivery(ad(), ctx({ walletBalanceCents: null }))).toBe('ok');
  });

  it('flags the daily budget when today\'s spend reached it', () => {
    expect(deriveDelivery(ad(), ctx({ spentTodayCents: 8000 }))).toBe('daily');
  });

  it('does not claim the daily budget when today\'s spend is unknown', () => {
    expect(deriveDelivery(ad(), ctx({ spentTodayCents: null }))).toBe('ok');
  });

  it('flags the total limit', () => {
    expect(deriveDelivery(ad({ totalSpendCents: 150000 }), ctx())).toBe('limit');
  });

  it('active but past its end date is an expired period, not "Encerrada"', () => {
    expect(deriveDelivery(ad({ endsAt: '2026-11-06T00:00:00Z' }), ctx())).toBe('expired');
  });

  it('active but before its start date is scheduled', () => {
    expect(deriveDelivery(ad({ startsAt: '2026-11-10T00:00:00Z' }), ctx())).toBe('scheduled');
  });

  it('no funds beats the daily budget', () => {
    expect(deriveDelivery(ad(), ctx({ walletBalanceCents: 0, spentTodayCents: 9999 }))).toBe('nofunds');
  });

  it.each([
    ['REVIEW', 'review'],
    ['REJECTED', 'rejected'],
    ['PAUSED', 'paused'],
    ['ENDED', 'ended'],
    ['DRAFT', 'draft'],
  ] as const)('status %s maps to %s regardless of wallet', (status, expected) => {
    expect(deriveDelivery(ad({ status }), ctx({ walletBalanceCents: 0 }))).toBe(expected);
  });

  it('a video draft without a file needs the video', () => {
    expect(deriveDelivery(ad({ status: 'DRAFT', format: 'VIDEO_16_9' }), ctx())).toBe('novideo');
  });

  it('a video draft with a file is just a draft', () => {
    expect(deriveDelivery(ad({ status: 'DRAFT', format: 'VIDEO_16_9', videoUrl: 'https://x/v.mp4' }), ctx())).toBe('draft');
  });
});

describe('needsAction', () => {
  it('only rejected and missing video ask the advertiser to act', () => {
    expect(needsAction('rejected')).toBe(true);
    expect(needsAction('novideo')).toBe(true);
    expect(needsAction('nofunds')).toBe(false);
    expect(needsAction('ok')).toBe(false);
  });
});

describe('deliveryLabel', () => {
  it('uses the start date for scheduled campaigns', () => {
    expect(deliveryLabel('scheduled', '2026-11-10T12:00:00Z')).toBe('Começa em 10/11');
  });

  it('daily budget label says when it comes back', () => {
    expect(deliveryLabel('daily', '2026-11-01T00:00:00Z')).toBe('Orçamento do dia atingido · volta às 21:00');
  });

  it('expired period', () => {
    expect(deliveryLabel('expired', '2026-11-01T00:00:00Z')).toBe('Período terminou');
  });
});
