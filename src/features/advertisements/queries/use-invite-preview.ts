'use client';

import { useQuery } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';

export const invitePreviewKey = (token: string) => ['advertiser-invites', token, 'preview'] as const;

export function useInvitePreviewQuery(token: string | null) {
  return useQuery({
    queryKey: invitePreviewKey(token ?? ''),
    queryFn: () => advertisersService.getInvitePreview(token!),
    enabled: token !== null,
    staleTime: 60_000,
  });
}
