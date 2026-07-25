'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';
import { myAdvertiserAccountsKey } from '../queries/use-my-advertiser-accounts';

// Accepting adds the caller as a member of a new advertiser account, so the
// account switcher list must refresh — same invalidation target as rename.
export function useAcceptInviteMutation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => advertisersService.acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAdvertiserAccountsKey });
    },
  });
}
