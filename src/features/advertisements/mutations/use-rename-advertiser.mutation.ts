'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';
import { myAdvertiserAccountsKey } from '../queries/use-my-advertiser-accounts';
import type { UpdateAdvertiserRequest } from '../types/advertisement.types';

export function useRenameAdvertiserMutation(accountId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAdvertiserRequest) => advertisersService.rename(accountId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAdvertiserAccountsKey });
    },
  });
}
