import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/shared/api/client';
import { advertisementsService } from './advertisements.service';
import type { AdResponse, CreateAdRequest } from '../types/advertisement.types';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient, true);

describe('advertisementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists ads scoped to the caller with no orgId/query param', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] });

    await advertisementsService.list();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/ads');
  });

  it('gets one ad by id', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: {} as AdResponse });

    await advertisementsService.getOne('ad-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/ads/ad-1');
  });

  it('gets review history for an ad', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] });

    await advertisementsService.getReviews('ad-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/ads/ad-1/reviews');
  });

  it('creates an ad with an EVENT destination', async () => {
    const payload: CreateAdRequest = {
      advertiserAccountId: 'acct-1',
      destination: { type: 'EVENT', eventId: 'event-1' },
      title: 'Summer Show',
      format: 'HORIZONTAL_728x90',
      placements: ['FEED'],
      targetDomains: [],
      targetCategories: [],
      billingModel: 'CPM',
      bidCents: 100,
      dailyBudgetCents: 1000,
      totalLimitCents: 5000,
      startsAt: '2026-08-01T00:00:00.000Z',
      endsAt: '2026-08-31T00:00:00.000Z',
    };
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as AdResponse });

    await advertisementsService.create(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/ads', payload);
  });

  it('creates an ad with an EXTERNAL_URL destination', async () => {
    const payload: CreateAdRequest = {
      advertiserAccountId: 'acct-1',
      destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
      title: 'External Promo',
      format: 'VERTICAL_300x600',
      placements: ['CHECKOUT'],
      targetDomains: [],
      targetCategories: [],
      billingModel: 'CPC',
      bidCents: 50,
      dailyBudgetCents: 500,
      totalLimitCents: 2000,
      startsAt: '2026-08-01T00:00:00.000Z',
      endsAt: '2026-08-31T00:00:00.000Z',
    };
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as AdResponse });

    await advertisementsService.create(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/ads', payload);
  });

  it('creates a draft ad without a destination', async () => {
    const payload: CreateAdRequest = {
      advertiserAccountId: 'acct-1',
      title: 'Draft',
      format: 'HORIZONTAL_728x90',
      placements: [],
      targetDomains: [],
      targetCategories: [],
      billingModel: 'CPM',
      bidCents: 100,
      dailyBudgetCents: 1000,
      totalLimitCents: 5000,
      startsAt: '2026-08-01T00:00:00.000Z',
      endsAt: '2026-08-31T00:00:00.000Z',
    };
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as AdResponse });

    await advertisementsService.create(payload);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/ads', payload);
    expect(payload.destination).toBeUndefined();
  });

  it('updates an ad', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ data: undefined });

    await advertisementsService.update('ad-1', { title: 'New title' });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/ads/ad-1', { title: 'New title' });
  });

  it('changes ad status', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ data: undefined });

    await advertisementsService.changeStatus('ad-1', { action: 'submit' });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/ads/ad-1/status', { action: 'submit' });
  });

  it('gets the ad report', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: {} });

    await advertisementsService.getReport('ad-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/ads/ad-1/report');
  });

  it('uploads a banner as multipart form data', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { bannerUrl: 'https://cdn/banner.png' } });
    const file = new File(['abc'], 'banner.png', { type: 'image/png' });

    const url = await advertisementsService.uploadBanner('ad-1', file);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/ads/ad-1/banner', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const [, formData] = mockedApiClient.post.mock.calls[0] as [string, FormData];
    expect(formData.get('file')).toBe(file);
    expect(url).toBe('https://cdn/banner.png');
  });

  it('uploads a video as multipart form data', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      data: { videoUrl: 'https://cdn/video.mp4', videoDurationSec: 15 },
    });
    const file = new File(['abc'], 'video.mp4', { type: 'video/mp4' });

    const result = await advertisementsService.uploadVideo('ad-1', file);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/ads/ad-1/video', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const [, formData] = mockedApiClient.post.mock.calls[0] as [string, FormData];
    expect(formData.get('file')).toBe(file);
    expect(result).toEqual({ videoUrl: 'https://cdn/video.mp4', videoDurationSec: 15 });
  });
});
