import type { AdBillingModel, AdPauseVariant, PauseMinBids } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from './format-currency';

export const PAUSE_VARIANT_NAME: Record<AdPauseVariant, string> = { STANDARD: 'Padrão', FULLSCREEN: 'Tela cheia' };

// "R$ 14,00 por mil · Tela cheia": o piso do lance da variante escolhida.
// null quando não é pausa ou as configurações ainda não chegaram.
export function pauseMinimumLabel(
  variant: AdPauseVariant | null,
  billingModel: AdBillingModel | null,
  minBids: PauseMinBids | undefined,
): string | null {
  if (!variant || !billingModel || !minBids) return null;
  const per = billingModel === 'CPM' ? 'por mil' : 'por clique';
  return `${formatCentsToBRL(minBids[variant][billingModel])} ${per} · ${PAUSE_VARIANT_NAME[variant]}`;
}
