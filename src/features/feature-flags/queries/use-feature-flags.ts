'use client';

import { useQuery } from '@tanstack/react-query';
import { featureFlagsService } from '../services/feature-flags.service';

export const featureFlagsKey = ['feature-flags'] as const;

export function useFeatureFlagsQuery() {
  return useQuery({
    queryKey: featureFlagsKey,
    queryFn: () => featureFlagsService.get(),
    staleTime: 5 * 60 * 1000,
    // No retries: fail open fast — a slow retry backoff would delay letting
    // advertisers in when the flags endpoint blips.
    retry: false,
  });
}
