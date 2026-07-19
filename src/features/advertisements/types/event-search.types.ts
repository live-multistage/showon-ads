// Thin slice of the public event shape (orchestrator's EventsController#toResponse)
// needed by the ad-create wizard's destination step to let an advertiser pick an
// EVENT destination by searching its title. Not a full port of the events feature.
export interface EventSearchResult {
  id: string;
  title: string;
  bannerUrl: string | null;
  thumbnailUrl: string | null;
  startsAt: string;
  status: string;
}

// Matches EventsController#toPaginatedResponse.
export interface EventSearchResponse {
  items: EventSearchResult[];
  page: number;
  pageSize: number;
  total: number;
}
