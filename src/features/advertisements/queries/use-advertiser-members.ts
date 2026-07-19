'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';

export const advertiserMembersKey = (accountId: string) => ['advertiser-accounts', accountId, 'members'] as const;

export function useAdvertiserMembersQuery(accountId: string | null) {
  return useQuery({
    queryKey: advertiserMembersKey(accountId ?? ''),
    queryFn: () => advertisersService.members(accountId!),
    enabled: accountId !== null,
    staleTime: 60_000,
  });
}
