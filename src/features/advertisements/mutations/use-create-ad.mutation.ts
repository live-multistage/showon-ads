'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';
import { adsKey } from '../queries/use-list-ads';
import type { CreateAdRequest } from '../types/advertisement.types';

export function useCreateAdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdRequest) => advertisementsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adsKey });
    },
  });
}
