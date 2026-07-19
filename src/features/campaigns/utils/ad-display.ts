import type { AdDestination, AdFormat, AdStatus } from '@/features/advertisements/types/advertisement.types';

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
};

// No event-title-by-id lookup endpoint exists yet (only /events/search by
// title), so an EVENT destination is shown generically rather than by name.
export function destinationLabel(destination: AdDestination | null): string {
  if (!destination) return 'Sem destino';
  return destination.type === 'EVENT' ? 'Evento' : 'URL externa';
}
