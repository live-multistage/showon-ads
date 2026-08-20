'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advertisementsService } from '../services/advertisements.service';
import { adKey } from '../queries/use-get-ad';

// Mirrors useUploadBannerMutation for the VIDEO_16_9 / PRE_ROLL creative —
// same adId-at-mutate-time shape so the wizard's create→upload→submit chain
// can call this hook unconditionally before the created ad's id is known.
export function useUploadVideoMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ videoUrl: string; videoDurationSec: number }, Error, { adId: string; file: File }>({
    mutationFn: ({ adId, file }) => advertisementsService.uploadVideo(adId, file),
    onSuccess: (_, { adId }) => {
      queryClient.invalidateQueries({ queryKey: adKey(adId) });
    },
  });
}
