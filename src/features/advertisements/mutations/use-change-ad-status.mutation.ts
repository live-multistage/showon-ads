'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';
import { adsKey } from '../queries/use-list-ads';
import { adKey } from '../queries/use-get-ad';
import type { AdStatusAction } from '../types/advertisement.types';

export function useChangeAdStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, action }: { adId: string; action: AdStatusAction }) =>
      advertisementsService.changeStatus(adId, { action }),
    onSuccess: (_, { adId }) => {
      queryClient.invalidateQueries({ queryKey: adKey(adId) });
      queryClient.invalidateQueries({ queryKey: adsKey });
    },
  });
}
