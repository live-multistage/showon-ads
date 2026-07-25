'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';
import { advertiserInvitesKey } from '../queries/use-advertiser-invites';
import type { CreateInviteRequest } from '../types/advertisement.types';

export function useCreateInviteMutation(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInviteRequest) => advertisersService.createInvite(accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advertiserInvitesKey(accountId) });
    },
  });
}
