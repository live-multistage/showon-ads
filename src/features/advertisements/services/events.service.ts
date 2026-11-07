import { apiClient } from '@/shared/api/client';
import type { EventSearchResponse } from '../types/event-search.types';

// GET /events/search is public (no auth guard on EventsController#searchEvents)
// and matches by title substring — used by the ad-create wizard to let an
// advertiser pick an EVENT destination.
export const eventsService = {
  // GET /events/:id é público (catálogo). Só o título importa aqui.
  getTitle: async (eventId: string): Promise<string> => {
    const { data } = await apiClient.get<{ title: string }>(`/events/${eventId}`);
    return data.title;
  },

  search: async (title: string): Promise<EventSearchResponse> => {
    const { data } = await apiClient.get<EventSearchResponse>('/events/search', { params: { title } });
    return data;
  },
};
