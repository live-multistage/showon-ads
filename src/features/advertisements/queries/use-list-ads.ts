'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';

export const adsKey = ['ads'] as const;

// No orgId param: GET /ads is membership-scoped to the caller server-side.
export function useListAdsQuery() {
  return useQuery({
    queryKey: adsKey,
    queryFn: () => advertisementsService.list(),
    staleTime: 30_000,
  });
}
