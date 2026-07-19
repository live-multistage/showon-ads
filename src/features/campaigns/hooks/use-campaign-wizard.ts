'use client';

import { useEffect, useRef, useState } from 'react';
import type { AdDestination, AdFormat } from '@/features/advertisements/types/advertisement.types';
import type { EventSearchResult } from '@/features/advertisements/types/event-search.types';

// Full step list per task 18 — only 'creative' and 'destination' have real
// content; 'targeting' / 'budget' / 'review' render placeholders until task 19
// wires them up (and the create→upload→submit orchestration on the final step).
export const WIZARD_STEPS = ['creative', 'destination', 'targeting', 'budget', 'review'] as const;
export type WizardStepId = (typeof WIZARD_STEPS)[number];

export type DestinationType = 'EVENT' | 'EXTERNAL_URL';

export interface CampaignWizardDraft {
  title: string;
  format: AdFormat | null;
  bannerFile: File | null;
  bannerPreviewUrl: string | null;
  destinationType: DestinationType | null;
  event: EventSearchResult | null;
  externalUrl: string;
}

const INITIAL_DRAFT: CampaignWizardDraft = {
  title: '',
  format: null,
  bannerFile: null,
  bannerPreviewUrl: null,
  destinationType: null,
  event: null,
  externalUrl: '',
};

// Mirrors orchestrator's IsHttpsUrl validator (shared/validators/is-https-url.validator.ts):
// scheme must be exactly https, no embedded credentials, max 512 chars.
const EXTERNAL_URL_MAX_LENGTH = 512;

export function validateExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'A URL é obrigatória.';
  if (trimmed.length > EXTERNAL_URL_MAX_LENGTH) return `A URL deve ter no máximo ${EXTERNAL_URL_MAX_LENGTH} caracteres.`;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return 'Informe uma URL válida.';
  }
  if (url.protocol !== 'https:') return 'A URL deve começar com https://.';
  if (url.username || url.password) return 'A URL não pode conter credenciais.';
  return null;
}

function validateCreativeStep(draft: CampaignWizardDraft): string | null {
  if (!draft.title.trim()) return 'Informe um título para a campanha.';
  if (!draft.format) return 'Selecione um formato de anúncio.';
  return null;
}

function validateDestinationStep(draft: CampaignWizardDraft): string | null {
  if (draft.destinationType === null) return 'Escolha um destino para o anúncio.';
  if (draft.destinationType === 'EVENT') {
    return draft.event ? null : 'Selecione um evento.';
  }
  return validateExternalUrl(draft.externalUrl);
}

// Steps beyond destination are task 19's scope — nothing to validate yet.
function validateStep(id: WizardStepId, draft: CampaignWizardDraft): string | null {
  if (id === 'creative') return validateCreativeStep(draft);
  if (id === 'destination') return validateDestinationStep(draft);
  return null;
}

// Translates the accumulated draft into the destination union CreateAdRequest
// expects. Used by task 19's submit; exposed here since it falls out of the
// draft shape this hook owns.
export function draftToDestination(draft: CampaignWizardDraft): AdDestination | undefined {
  if (draft.destinationType === 'EVENT' && draft.event) {
    return { type: 'EVENT', eventId: draft.event.id };
  }
  if (draft.destinationType === 'EXTERNAL_URL' && !validateExternalUrl(draft.externalUrl)) {
    return { type: 'EXTERNAL_URL', url: draft.externalUrl.trim() };
  }
  return undefined;
}

export function useCampaignWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<CampaignWizardDraft>(INITIAL_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const step = WIZARD_STEPS[stepIndex];

  // Track the latest preview URL in a ref so the unmount cleanup below (which
  // only runs once, on an empty-deps effect) doesn't close over the
  // mount-time (null) value of draft.bannerPreviewUrl.
  const bannerPreviewUrlRef = useRef(draft.bannerPreviewUrl);
  bannerPreviewUrlRef.current = draft.bannerPreviewUrl;

  // Revoke the last object URL on unmount so an abandoned draft doesn't leak it.
  useEffect(() => {
    return () => {
      if (bannerPreviewUrlRef.current) URL.revokeObjectURL(bannerPreviewUrlRef.current);
    };
  }, []);

  function updateDraft(patch: Partial<CampaignWizardDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function setBanner(file: File | null) {
    setDraft((prev) => {
      if (prev.bannerPreviewUrl) URL.revokeObjectURL(prev.bannerPreviewUrl);
      return { ...prev, bannerFile: file, bannerPreviewUrl: file ? URL.createObjectURL(file) : null };
    });
  }

  function next() {
    const validationError = validateStep(step, draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function goToStep(id: WizardStepId) {
    const targetIndex = WIZARD_STEPS.indexOf(id);
    if (targetIndex <= stepIndex) {
      // Only allow jumping backward directly — forward jumps must go through next()'s validation.
      setError(null);
      setStepIndex(targetIndex);
    }
  }

  // Soft warning (not a step blocker) — mirrors Ad#submitForReview's rule that
  // EXTERNAL_URL ads need a banner, but that's only enforced at submit time.
  const bannerRequiredWarning =
    draft.destinationType === 'EXTERNAL_URL' && !draft.bannerFile
      ? 'Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'
      : null;

  return {
    steps: WIZARD_STEPS,
    step,
    stepIndex,
    draft,
    error,
    bannerRequiredWarning,
    updateDraft,
    setBanner,
    next,
    back,
    goToStep,
  };
}
