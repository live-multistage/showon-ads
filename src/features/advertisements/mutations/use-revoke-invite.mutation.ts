'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';
import { advertiserInvitesKey } from '../queries/use-advertiser-invites';

export function useRevokeInviteMutation(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => advertisersService.revokeInvite(accountId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advertiserInvitesKey(accountId) });
    },
  });
}
