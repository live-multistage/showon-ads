'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';

export const myAdvertiserAccountsKey = ['advertiser-accounts', 'me'] as const;

export function useMyAdvertiserAccountsQuery() {
  return useQuery({
    queryKey: myAdvertiserAccountsKey,
    queryFn: () => advertisersService.me(),
    staleTime: 60_000,
  });
}
