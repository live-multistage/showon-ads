'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  AdBillingModel,
  AdDestination,
  AdFormat,
  AdPlacement,
  AgeBracket,
  CreateAdRequest,
  FrequencyCapWindow,
} from '@/features/advertisements/types/advertisement.types';
import type { EventSearchResult } from '@/features/advertisements/types/event-search.types';
import { reaisToCents } from '../utils/format-currency';
import { acceptedFormatsFor, ALL_PLACEMENTS, DEFAULT_PLACEMENTS } from '../utils/ad-display';

// Re-export for backward compatibility with TargetingStep.tsx
export { ALL_PLACEMENTS };

// Wizard order: budget -> targeting -> creative (creative + destination
// merged into one step) -> review.
export const WIZARD_STEPS = ['budget', 'targeting', 'creative', 'review'] as const;
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
  targetDomains: string[];
  targetCategories: string[];
  targetAgeBrackets: AgeBracket[];
  placements: AdPlacement[];
  billingModel: AdBillingModel | null;
  bidReais: string;
  dailyBudgetReais: string;
  totalLimitReais: string;
  frequencyCapMax: string;
  frequencyCapWindow: FrequencyCapWindow | null;
  startsAt: string;
  endsAt: string;
}

const INITIAL_DRAFT: CampaignWizardDraft = {
  title: '',
  format: null,
  bannerFile: null,
  bannerPreviewUrl: null,
  destinationType: null,
  event: null,
  externalUrl: '',
  targetDomains: [],
  targetCategories: [],
  targetAgeBrackets: [],
  placements: DEFAULT_PLACEMENTS,
  billingModel: null,
  bidReais: '',
  dailyBudgetReais: '',
  totalLimitReais: '',
  frequencyCapMax: '',
  frequencyCapWindow: null,
  startsAt: '',
  endsAt: '',
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

// Exported so EditCampaignForm (task 20) can validate the creative fields on
// their own, independent of the destination-optional-on-save rule below.
export function validateCreativeStep(draft: CampaignWizardDraft): string | null {
  if (!draft.title.trim()) return 'Informe um título para a campanha.';
  if (!draft.format) return 'Selecione um formato de anúncio.';
  return null;
}

// Exported for the same reason as validateCreativeStep.
export function validateDestinationStep(draft: CampaignWizardDraft): string | null {
  if (draft.destinationType === null) return 'Escolha um destino para o anúncio.';
  if (draft.destinationType === 'EVENT') {
    return draft.event ? null : 'Selecione um evento.';
  }
  return validateExternalUrl(draft.externalUrl);
}

// Domains/categories/age brackets are optional filters — an empty selection
// just means "no targeting restriction" server-side. Placements are the one
// required field here: at least one must stay selected or the ad has
// nowhere to serve.
function validateTargetingStep(draft: CampaignWizardDraft): string | null {
  if (draft.placements.length === 0) return 'Selecione pelo menos um posicionamento.';
  if (acceptedFormatsFor(draft.placements).length === 0) {
    return 'Os posicionamentos selecionados não podem ser combinados, pois usam formatos incompatíveis.';
  }
  return null;
}

// Mirrors orchestrator's Ad.create validation (src/advertisements/domain/ad.ts)
// so the wizard fails fast instead of round-tripping to the API.
function validateBudgetStep(draft: CampaignWizardDraft): string | null {
  if (!draft.billingModel) return 'Selecione um modelo de cobrança.';
  if (reaisToCents(draft.bidReais) <= 0) return 'O lance deve ser maior que zero.';
  if (reaisToCents(draft.dailyBudgetReais) <= 0) return 'O orçamento diário deve ser maior que zero.';
  if (reaisToCents(draft.totalLimitReais) < reaisToCents(draft.dailyBudgetReais)) {
    return 'O limite total deve ser maior ou igual ao orçamento diário.';
  }
  if (!draft.startsAt || !draft.endsAt) return 'Informe o período de veiculação.';
  if (new Date(draft.startsAt) >= new Date(draft.endsAt)) return 'A data de início deve ser anterior à data de fim.';
  return null;
}

// Exported so the campaign detail page's edit mode (task 20) can reuse the
// exact same per-step validation instead of re-implementing it.
export function validateStep(id: WizardStepId, draft: CampaignWizardDraft): string | null {
  // 'creative' now renders CreativeStep + DestinationStep stacked, so it
  // validates both — creative error surfaces first.
  if (id === 'creative') return validateCreativeStep(draft) || validateDestinationStep(draft);
  if (id === 'targeting') return validateTargetingStep(draft);
  if (id === 'budget') return validateBudgetStep(draft);
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

// Assembles the full CreateAdRequest from the accumulated draft. Only called
// from the review step's submit, by which point every earlier step's next()
// has already validated its slice — format/billingModel/dates are trusted
// non-null here.
export function draftToCreateAdRequest(
  draft: CampaignWizardDraft,
  advertiserAccountId: string,
): CreateAdRequest {
  return {
    advertiserAccountId,
    destination: draftToDestination(draft),
    title: draft.title.trim(),
    format: draft.format as AdFormat,
    placements: draft.placements,
    targetDomains: draft.targetDomains,
    targetCategories: draft.targetCategories,
    targetAgeBrackets: draft.targetAgeBrackets,
    frequencyCapMax: draft.frequencyCapMax ? Number(draft.frequencyCapMax) : undefined,
    frequencyCapWindow: draft.frequencyCapMax ? (draft.frequencyCapWindow ?? undefined) : undefined,
    billingModel: draft.billingModel as AdBillingModel,
    bidCents: reaisToCents(draft.bidReais),
    dailyBudgetCents: reaisToCents(draft.dailyBudgetReais),
    totalLimitCents: reaisToCents(draft.totalLimitReais),
    startsAt: new Date(draft.startsAt).toISOString(),
    endsAt: new Date(draft.endsAt).toISOString(),
  };
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
