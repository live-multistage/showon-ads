'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';
import { adKey } from '../queries/use-get-ad';

// Uploads/replaces the ad creative. On success the ad detail is refetched so
// the new banner shows immediately.
export function useUploadBannerMutation(adId: string) {
  const queryClient = useQueryClient();
  return useMutation<string, Error, File>({
    mutationFn: (file) => advertisementsService.uploadBanner(adId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKey(adId) });
    },
  });
}
