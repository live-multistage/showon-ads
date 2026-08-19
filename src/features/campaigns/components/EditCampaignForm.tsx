'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button, Card, CardContent } from '@live-show/design-system';
import { useUpdateAdMutation } from '@/features/advertisements/mutations/use-update-ad.mutation';
import { useUploadBannerMutation } from '@/features/advertisements/mutations/use-upload-banner.mutation';
import type { AdResponse } from '@/features/advertisements/types/advertisement.types';
import { validateStep, type CampaignWizardDraft } from '../hooks/use-campaign-wizard';
import { adToDraft, draftToUpdateAdRequest } from '../utils/ad-draft';
import { CreativeStep } from './steps/CreativeStep';
import { DestinationStep } from './steps/DestinationStep';
import { TargetingStep } from './steps/TargetingStep';
import { BudgetStep } from './steps/BudgetStep';
import styles from './EditCampaignForm.module.scss';

interface EditCampaignFormProps {
  ad: AdResponse;
  onCancel: () => void;
  onSaved: () => void;
}

// Ad#update (unlike #submitForReview) never requires a destination — only
// resubmitting for review does — so a legacy null-destination ad must stay
// savable. Correctness of a destination the advertiser *did* pick is still
// validated by reusing the wizard's own step check.
function validateDestinationForSave(draft: CampaignWizardDraft): string | null {
  if (draft.destinationType === null) return null;
  return validateStep('destination', draft);
}

function validateForSave(draft: CampaignWizardDraft): string | null {
  return (
    validateStep('creative', draft) ||
    validateDestinationForSave(draft) ||
    validateStep('targeting', draft) ||
    validateStep('budget', draft)
  );
}

// Reuses the create wizard's step components (task 18/19) in a stacked,
// single-screen edit form instead of a multi-step flow — editing an existing
// campaign has no "review" step to build up to, every field is already known.
export function EditCampaignForm({ ad, onCancel, onSaved }: EditCampaignFormProps) {
  const [draft, setDraft] = useState<CampaignWizardDraft>(() => adToDraft(ad));
  const [error, setError] = useState<string | null>(null);
  const [hasBanner, setHasBanner] = useState(!!ad.bannerUrl);
  const updateAd = useUpdateAdMutation(ad.id);
  const uploadBanner = useUploadBannerMutation();

  // Object URLs created for freshly-picked banner previews — revoked on
  // unmount so an abandoned edit doesn't leak them (the original ad.bannerUrl
  // seeded into bannerPreviewUrl is a remote URL, never one of these).
  const createdPreviewUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      createdPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function updateDraft(patch: Partial<CampaignWizardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  // Banner replacement is immediate — its own upload endpoint, independent of
  // the rest of this form's Save — matching AdDetailPage.tsx's legacy behavior.
  function setBanner(file: File | null) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    createdPreviewUrlsRef.current.push(previewUrl);
    updateDraft({ bannerPreviewUrl: previewUrl });
    uploadBanner.mutate(
      { adId: ad.id, file },
      {
        onSuccess: () => {
          setHasBanner(true);
          toast.success('Imagem atualizada.');
        },
        onError: () => toast.error('Não foi possível enviar a imagem.'),
      },
    );
  }

  const bannerRequiredWarning =
    draft.destinationType === 'EXTERNAL_URL' && !hasBanner
      ? 'Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'
      : null;

  async function handleSave() {
    const validationError = validateForSave(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await updateAd.mutateAsync(draftToUpdateAdRequest(draft));
      toast.success('Campanha atualizada.');
      onSaved();
    } catch {
      toast.error('Não foi possível salvar as alterações. Verifique os dados e tente novamente.');
    }
  }

  const isSaving = updateAd.isPending;

  return (
    <div className={styles.form}>
      <Card>
        <CardContent className={styles.content}>
          <CreativeStep draft={draft} updateDraft={updateDraft} setBanner={setBanner} />
          <DestinationStep draft={draft} updateDraft={updateDraft} bannerRequiredWarning={bannerRequiredWarning} />
          <TargetingStep draft={draft} updateDraft={updateDraft} />
          <BudgetStep draft={draft} updateDraft={updateDraft} />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <div className={styles.footer}>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
