import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/shared/api/client';
import { featureFlagsService } from './feature-flags.service';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient, true);

describe('featureFlagsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the public feature-flags map', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { advertiser_platform: true } });

    const result = await featureFlagsService.get();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/feature-flags');
    expect(result).toEqual({ advertiser_platform: true });
  });
});
