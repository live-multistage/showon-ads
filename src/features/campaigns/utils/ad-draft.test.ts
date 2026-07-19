import { describe, it, expect } from 'vitest';
import { adToDraft, draftToUpdateAdRequest, isoToDatetimeLocalValue } from './ad-draft';
import type { AdResponse } from '@/features/advertisements/types/advertisement.types';

function makeAd(overrides: Partial<AdResponse>): AdResponse {
  return {
    id: 'ad-1',
    advertiserAccountId: 'acc-1',
    destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
    title: 'Summer Promo',
    format: 'HORIZONTAL_728x90',
    status: 'DRAFT',
    placements: ['FEED'],
    targetDomains: ['ENTERTAINMENT'],
    targetCategories: ['festival'],
    bannerUrl: 'https://cdn.example.com/banner.png',
    frequencyCapMax: 3,
    frequencyCapWindow: 'day',
    billingModel: 'CPM',
    bidCents: 1050,
    dailyBudgetCents: 5000,
    totalLimitCents: 50000,
    totalSpendCents: 1200,
    startsAt: '2026-08-01T10:00:00.000Z',
    endsAt: '2026-09-01T10:00:00.000Z',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isoToDatetimeLocalValue', () => {
  it('round-trips through new Date() back to the same instant', () => {
    const iso = '2026-08-01T10:30:00.000Z';
    const localValue = isoToDatetimeLocalValue(iso);
    expect(new Date(localValue).toISOString()).toBe(new Date(iso).toISOString());
  });
});

describe('adToDraft', () => {
  it('seeds an EXTERNAL_URL destination and every editable field', () => {
    const draft = adToDraft(makeAd({}));

    expect(draft.title).toBe('Summer Promo');
    expect(draft.format).toBe('HORIZONTAL_728x90');
    expect(draft.destinationType).toBe('EXTERNAL_URL');
    expect(draft.externalUrl).toBe('https://example.com');
    expect(draft.event).toBeNull();
    expect(draft.bannerPreviewUrl).toBe('https://cdn.example.com/banner.png');
    expect(draft.bannerFile).toBeNull();
    expect(draft.targetDomains).toEqual(['ENTERTAINMENT']);
    expect(draft.targetCategories).toEqual(['festival']);
    expect(draft.billingModel).toBe('CPM');
    expect(draft.bidReais).toBe('10.5');
    expect(draft.dailyBudgetReais).toBe('50');
    expect(draft.totalLimitReais).toBe('500');
    expect(draft.frequencyCapMax).toBe('3');
    expect(draft.frequencyCapWindow).toBe('day');
  });

  it('seeds a placeholder event (never sent to the backend) for an EVENT destination', () => {
    const draft = adToDraft(makeAd({ destination: { type: 'EVENT', eventId: 'evt-1' } }));

    expect(draft.destinationType).toBe('EVENT');
    expect(draft.event?.id).toBe('evt-1');
  });

  it('leaves destinationType null for a legacy destination-less ad', () => {
    const draft = adToDraft(makeAd({ destination: null }));

    expect(draft.destinationType).toBeNull();
    expect(draft.event).toBeNull();
    expect(draft.externalUrl).toBe('');
  });
});

describe('draftToUpdateAdRequest', () => {
  it('builds a PATCH payload with cents conversions and the destination union, omitting placements', () => {
    const draft = adToDraft(makeAd({}));
    const request = draftToUpdateAdRequest(draft);

    expect(request).toEqual({
      destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
      title: 'Summer Promo',
      format: 'HORIZONTAL_728x90',
      targetDomains: ['ENTERTAINMENT'],
      targetCategories: ['festival'],
      frequencyCapMax: 3,
      frequencyCapWindow: 'day',
      billingModel: 'CPM',
      bidCents: 1050,
      dailyBudgetCents: 5000,
      totalLimitCents: 50000,
      startsAt: new Date('2026-08-01T10:00:00.000Z').toISOString(),
      endsAt: new Date('2026-09-01T10:00:00.000Z').toISOString(),
    });
    expect(request).not.toHaveProperty('placements');
    expect(request).not.toHaveProperty('bannerUrl');
  });

  it('omits destination when the legacy ad has none and the advertiser has not picked one yet', () => {
    const draft = adToDraft(makeAd({ destination: null }));
    const request = draftToUpdateAdRequest(draft);

    expect(request.destination).toBeUndefined();
  });
});
