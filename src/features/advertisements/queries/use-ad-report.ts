'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';

export const adReportKey = (adId: string) => ['ads', 'report', adId] as const;

export function useAdReportQuery(adId: string | undefined) {
  return useQuery({
    queryKey: adReportKey(adId ?? ''),
    queryFn: () => advertisementsService.getReport(adId!),
    enabled: !!adId,
    staleTime: 60_000,
  });
}
