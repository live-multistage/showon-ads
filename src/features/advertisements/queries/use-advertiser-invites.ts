'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';

export const advertiserInvitesKey = (accountId: string) => ['advertiser-accounts', accountId, 'invites'] as const;

export function useAdvertiserInvitesQuery(accountId: string | null) {
  return useQuery({
    queryKey: advertiserInvitesKey(accountId ?? ''),
    queryFn: () => advertisersService.listInvites(accountId!),
    enabled: accountId !== null,
    staleTime: 60_000,
  });
}
