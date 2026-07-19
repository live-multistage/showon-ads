'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';
import { adKey } from '../queries/use-get-ad';

// Uploads/replaces the ad creative. On success the ad detail is refetched so
// the new banner shows immediately. adId is a mutate-time argument (not a
// hook-construction one) so the wizard's create→upload→submit chain can call
// this hook unconditionally before the created ad's id is known.
export function useUploadBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, { adId: string; file: File }>({
    mutationFn: ({ adId, file }) => advertisementsService.uploadBanner(adId, file),
    onSuccess: (_, { adId }) => {
      queryClient.invalidateQueries({ queryKey: adKey(adId) });
    },
  });
}
