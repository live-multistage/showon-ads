import type { AdDestination, AdFormat, AdPlacement, AdStatus } from '@/features/advertisements/types/advertisement.types';

// Shared display maps — used by both the campaign list and detail pages so
// status/format labels never drift between the two.
export const STATUS_LABEL: Record<AdStatus, string> = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em análise',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  ENDED: 'Encerrado',
  REJECTED: 'Rejeitado',
};

export const STATUS_BADGE_VARIANT: Record<AdStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  REVIEW: 'secondary',
  ACTIVE: 'default',
  PAUSED: 'outline',
  ENDED: 'secondary',
  REJECTED: 'destructive',
};

export const FORMAT_LABEL: Record<AdFormat, string> = {
  HORIZONTAL_728x90: 'Horizontal 728×90',
  VERTICAL_300x600: 'Vertical 300×600',
  WIDE_16_9: 'Tela ampla 16:9',
};

// Mirrors the orchestrator domain's PLACEMENT_ACCEPTED_FORMATS (single source
// of truth) — hand-copied per the contract-mirroring convention used for the
// type unions above. A campaign has one format for every placement it
// targets, so the format must be accepted by every selected placement.
export const PLACEMENT_ACCEPTED_FORMATS: Record<AdPlacement, AdFormat[]> = {
  FEED: ['HORIZONTAL_728x90', 'VERTICAL_300x600'],
  EVENT_DETAIL: ['HORIZONTAL_728x90', 'VERTICAL_300x600'],
  CHECKOUT: ['HORIZONTAL_728x90', 'VERTICAL_300x600'],
  POST_PURCHASE: ['HORIZONTAL_728x90', 'VERTICAL_300x600'],
  PLAYER_PAUSE: ['WIDE_16_9'],
};

// Formats accepted by every one of the given placements. Empty when the
// selection has no compatible format (e.g. PLAYER_PAUSE combined with any
// page placement) — used to gate targeting validation and to filter the
// creative step's format cards.
export function acceptedFormatsFor(placements: AdPlacement[]): AdFormat[] {
  if (placements.length === 0) return [];
  return placements.reduce<AdFormat[]>(
    (acc, placement) => acc.filter((format) => PLACEMENT_ACCEPTED_FORMATS[placement].includes(format)),
    PLACEMENT_ACCEPTED_FORMATS[placements[0]],
  );
}

// No event-title-by-id lookup endpoint exists yet (only /events/search by
// title), so an EVENT destination is shown generically rather than by name.
export function destinationLabel(destination: AdDestination | null): string {
  if (!destination) return 'Sem destino';
  return destination.type === 'EVENT' ? 'Evento' : 'URL externa';
}

export const FORMAT_SHORT: Record<AdFormat, string> = {
  HORIZONTAL_728x90: '728×90',
  VERTICAL_300x600: '300×600',
  WIDE_16_9: '16:9',
};

export const PLACEMENT_LABEL: Record<AdPlacement, string> = {
  FEED: 'Feed',
  EVENT_DETAIL: 'Página do evento',
  CHECKOUT: 'Checkout',
  POST_PURCHASE: 'Pós-compra',
  PLAYER_PAUSE: 'Pausa do player',
};

export function placementLabel(placement: string): string {
  return PLACEMENT_LABEL[placement as AdPlacement] ?? placement;
}

// Deterministic per-ad gradient — same hash live-show-react's AdBanner uses,
// so a campaign's row thumbnail matches what viewers actually see when it
// has no uploaded banner yet.
const THUMB_GRADIENTS = [
  'linear-gradient(135deg,#ff2e9e 0%,#9b7bff 100%)',
  'linear-gradient(160deg,#ff7a4d 0%,#ffd166 100%)',
  'linear-gradient(135deg,#5fb4ff 0%,#9b7bff 100%)',
  'linear-gradient(135deg,#ffd166 0%,#ff7a4d 100%)',
  'linear-gradient(135deg,#bba6ff 0%,#5fb4ff 100%)',
  'linear-gradient(135deg,#7fe0a0 0%,#5fb4ff 100%)',
];

export function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return THUMB_GRADIENTS[h % THUMB_GRADIENTS.length];
}
