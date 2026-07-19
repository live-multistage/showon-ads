'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';

export const adKey = (id: string) => ['ads', 'detail', id] as const;

export function useGetAdQuery(id: string | undefined) {
  return useQuery({
    queryKey: adKey(id ?? ''),
    queryFn: () => advertisementsService.getOne(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
