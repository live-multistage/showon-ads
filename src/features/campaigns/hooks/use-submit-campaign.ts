'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { normalizeError } from '@/shared/api/client';
import { useCreateAdMutation } from '@/features/advertisements/mutations/use-create-ad.mutation';
import { useUploadBannerMutation } from '@/features/advertisements/mutations/use-upload-banner.mutation';
import { useUploadVideoMutation } from '@/features/advertisements/mutations/use-upload-video.mutation';
import { useChangeAdStatusMutation } from '@/features/advertisements/mutations/use-change-ad-status.mutation';
import { draftToCreateAdRequest, type CampaignWizardDraft } from './use-campaign-wizard';

// Submit chain per task 19: createAd (lands as DRAFT) → upload the staged
// creative if one exists → submit for review. VIDEO_16_9 (PRE_ROLL) uploads
// through the video endpoint instead of the banner one (task 10) — every
// other format still uses uploadBanner. If create succeeds but upload/submit
// fails, the ad already exists as a retryable DRAFT — redirect to its detail
// page (task 20) instead of silently losing it or retrying blindly here.
export function useSubmitCampaign() {
  const router = useRouter();
  const createAd = useCreateAdMutation();
  const uploadBanner = useUploadBannerMutation();
  const uploadVideo = useUploadVideoMutation();
  const changeStatus = useChangeAdStatusMutation();

  const isSubmitting = createAd.isPending || uploadBanner.isPending || uploadVideo.isPending || changeStatus.isPending;

  // "Não foi possível enviar": o formulário continua na revisão com as escolhas.
  const [createFailed, setCreateFailed] = useState(false);

  // Resolve true quando o anúncio chegou a ser criado (mesmo que o envio para análise falhe).
  async function submit(draft: CampaignWizardDraft, advertiserAccountId: string): Promise<boolean> {
    setCreateFailed(false);
    const request = draftToCreateAdRequest(draft, advertiserAccountId);

    let adId: string;
    try {
      const created = await createAd.mutateAsync(request);
      adId = created.id;
    } catch (error) {
      setCreateFailed(true);
      // 400 traz mensagem em PT-BR pronta para exibir (ex.: lance abaixo do mínimo da variante).
      const { status, message } = normalizeError(error);
      toast.error(status === 400 && message ? message : 'Não foi possível criar a campanha. Verifique os dados e tente novamente.');
      return false;
    }

    try {
      if (draft.bannerFile) {
        if (draft.format === 'VIDEO_16_9') {
          await uploadVideo.mutateAsync({ adId, file: draft.bannerFile });
        } else {
          await uploadBanner.mutateAsync({ adId, file: draft.bannerFile });
        }
      }
      await changeStatus.mutateAsync({ adId, action: 'submit' });
    } catch {
      toast.error(
        'Campanha criada como rascunho, mas o envio para revisão falhou. Tente novamente na página da campanha.',
      );
      router.push(`/campaigns/${adId}`);
      return true;
    }

    toast.success('Campanha enviada para revisão — em análise.');
    router.push(`/campaigns/${adId}`);
    return true;
  }

  return { submit, isSubmitting, createFailed };
}
