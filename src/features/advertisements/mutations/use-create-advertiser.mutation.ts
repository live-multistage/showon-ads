'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisersService } from '../services/advertisers.service';
import { myAdvertiserAccountsKey } from '../queries/use-my-advertiser-accounts';
import type { CreateAdvertiserRequest } from '../types/advertisement.types';

export function useCreateAdvertiserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdvertiserRequest) => advertisersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAdvertiserAccountsKey });
    },
  });
}
