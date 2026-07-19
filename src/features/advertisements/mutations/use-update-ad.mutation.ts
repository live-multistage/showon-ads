'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';
import { adKey } from '../queries/use-get-ad';
import { adsKey } from '../queries/use-list-ads';
import type { UpdateAdRequest } from '../types/advertisement.types';

export function useUpdateAdMutation(adId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAdRequest) => advertisementsService.update(adId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKey(adId) });
      queryClient.invalidateQueries({ queryKey: adsKey });
    },
  });
}
