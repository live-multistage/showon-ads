import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/shared/api/client';
import { advertisersService } from './advertisers.service';
import type { AdvertiserAccountResponse } from '../types/advertisement.types';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient, true);

describe('advertisersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an advertiser account', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as AdvertiserAccountResponse });

    await advertisersService.create({ name: 'Acme Corp' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/advertisers', { name: 'Acme Corp' });
  });

  it('lists the caller\'s advertiser accounts with no id param', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] });

    await advertisersService.me();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/advertisers/me');
  });
});
