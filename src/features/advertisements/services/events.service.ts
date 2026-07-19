import { apiClient } from '@/shared/api/client';
import type { EventSearchResponse } from '../types/event-search.types';

// GET /events/search is public (no auth guard on EventsController#searchEvents)
// and matches by title substring — used by the ad-create wizard to let an
// advertiser pick an EVENT destination.
export const eventsService = {
  search: async (title: string): Promise<EventSearchResponse> => {
    const { data } = await apiClient.get<EventSearchResponse>('/events/search', { params: { title } });
    return data;
  },
};
