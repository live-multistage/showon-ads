import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/shared/api/client';
import { eventsService } from './events.service';
import type { EventSearchResponse } from '../types/event-search.types';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient, true);

describe('eventsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches events by title', async () => {
    const response: EventSearchResponse = { items: [], page: 1, pageSize: 20, total: 0 };
    mockedApiClient.get.mockResolvedValueOnce({ data: response });

    const result = await eventsService.search('Summer');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/events/search', { params: { title: 'Summer' } });
    expect(result).toEqual(response);
  });
});
