import type { AdResponse, UpdateAdRequest } from '@/features/advertisements/types/advertisement.types';
import type { EventSearchResult } from '@/features/advertisements/types/event-search.types';
import { centsToReaisInput, reaisToCents } from './format-currency';
import { draftToDestination, type CampaignWizardDraft } from '../hooks/use-campaign-wizard';

// GET /ads/:id only returns the destination's eventId (no title-by-id lookup
// endpoint exists — /events/search only matches by title), so an existing
// EVENT destination is seeded with a placeholder label rather than a real
// title. It's never sent to the backend: draftToDestination only reads
// event.id for the payload.
function existingEventPlaceholder(eventId: string): EventSearchResult {
  return { id: eventId, title: 'Evento atual', bannerUrl: null, thumbnailUrl: null, startsAt: '', status: '' };
}

// Inverse of the ISO strings the API returns: renders the wall-clock date
// parts (not UTC) so the value round-trips through a datetime-local input —
// `new Date(startsAt)` below reads it back as local time, same as the input did.
export function isoToDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Seeds the wizard's draft shape from an existing ad so its step components
// (Creative/Destination/Targeting/Budget) can be reused unmodified in the
// campaign detail page's edit mode (task 20) — see CampaignWizardDraft.
export function adToDraft(ad: AdResponse): CampaignWizardDraft {
  return {
    title: ad.title,
    format: ad.format,
    bannerFile: null,
    // bannerPreviewUrl doubles as the generic creative-preview slot: a
    // VIDEO_16_9 ad has no bannerUrl, only videoUrl.
    bannerPreviewUrl: ad.bannerUrl ?? ad.videoUrl,
    destinationType: ad.destination?.type ?? null,
    event: ad.destination?.type === 'EVENT' ? existingEventPlaceholder(ad.destination.eventId) : null,
    externalUrl: ad.destination?.type === 'EXTERNAL_URL' ? ad.destination.url : '',
    targetDomains: [...ad.targetDomains],
    targetCategories: [...ad.targetCategories],
    targetAgeBrackets: [...(ad.targetAgeBrackets ?? [])],
    placements: [...ad.placements],
    billingModel: ad.billingModel,
    bidReais: centsToReaisInput(ad.bidCents),
    dailyBudgetReais: centsToReaisInput(ad.dailyBudgetCents),
    totalLimitReais: centsToReaisInput(ad.totalLimitCents),
    frequencyCapMax: ad.frequencyCapMax != null ? String(ad.frequencyCapMax) : '',
    frequencyCapWindow: ad.frequencyCapWindow,
    startsAt: isoToDatetimeLocalValue(ad.startsAt),
    endsAt: isoToDatetimeLocalValue(ad.endsAt),
  };
}

// Inverse of adToDraft for the PATCH payload (use-update-ad). The banner is
// never part of this payload: it's replaced via its own upload endpoint
// (see EditCampaignForm), not PATCH /ads/:id.
export function draftToUpdateAdRequest(draft: CampaignWizardDraft): UpdateAdRequest {
  return {
    destination: draftToDestination(draft),
    title: draft.title.trim(),
    format: draft.format ?? undefined,
    placements: draft.placements,
    targetDomains: draft.targetDomains,
    targetCategories: draft.targetCategories,
    targetAgeBrackets: draft.targetAgeBrackets,
    frequencyCapMax: draft.frequencyCapMax ? Number(draft.frequencyCapMax) : undefined,
    frequencyCapWindow: draft.frequencyCapMax ? (draft.frequencyCapWindow ?? undefined) : undefined,
    billingModel: draft.billingModel ?? undefined,
    bidCents: reaisToCents(draft.bidReais),
    dailyBudgetCents: reaisToCents(draft.dailyBudgetReais),
    totalLimitCents: reaisToCents(draft.totalLimitReais),
    startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : undefined,
    endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : undefined,
  };
}
