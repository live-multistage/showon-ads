import type { AdResponse } from '@/features/advertisements/types/advertisement.types';

export type Delivery =
  | 'ok'
  | 'daily'
  | 'limit'
  | 'nofunds'
  | 'scheduled'
  | 'review'
  | 'rejected'
  | 'paused'
  | 'ended'
  | 'draft'
  | 'novideo';

type Tone = 'ok' | 'warn' | 'err' | 'off';

export const DELIVERY_DISPLAY: Record<Delivery, { tone: Tone; label: string }> = {
  ok: { tone: 'ok', label: 'Entregando' },
  daily: { tone: 'warn', label: 'Orçamento do dia atingido' },
  limit: { tone: 'warn', label: 'Limite total atingido' },
  nofunds: { tone: 'err', label: 'Parada: sem saldo' },
  scheduled: { tone: 'warn', label: 'Aprovada: começa na data de início' },
  review: { tone: 'warn', label: 'Aguardando análise' },
  rejected: { tone: 'err', label: 'Precisa de ajuste' },
  paused: { tone: 'off', label: 'Pausada por você' },
  ended: { tone: 'off', label: 'Encerrada' },
  draft: { tone: 'off', label: 'Não enviada' },
  novideo: { tone: 'off', label: 'Falta enviar o vídeo' },
};

export interface DeliveryContext {
  now: Date;
  // null = saldo ainda desconhecido (carregando ou falhou): não afirma "sem saldo".
  walletBalanceCents: number | null;
  // null = gasto do dia não disponível: não afirma "orçamento do dia atingido".
  spentTodayCents: number | null;
}

type DeliveryAd = Pick<
  AdResponse,
  'status' | 'format' | 'videoUrl' | 'startsAt' | 'endsAt' | 'dailyBudgetCents' | 'totalLimitCents' | 'totalSpendCents'
>;

// Diagnóstico derivado só do que o front já tem: status, datas, carteira,
// gasto do dia e vídeo. Não inventa causa que não consegue medir.
export function deriveDelivery(ad: DeliveryAd, ctx: DeliveryContext): Delivery {
  switch (ad.status) {
    case 'ENDED':
      return 'ended';
    case 'REJECTED':
      return 'rejected';
    case 'PAUSED':
      return 'paused';
    case 'REVIEW':
      return 'review';
    case 'DRAFT':
      return ad.format === 'VIDEO_16_9' && !ad.videoUrl ? 'novideo' : 'draft';
    case 'ACTIVE':
      return deriveActive(ad, ctx);
  }
}

function deriveActive(ad: DeliveryAd, { now, walletBalanceCents, spentTodayCents }: DeliveryContext): Delivery {
  if (new Date(ad.endsAt) < now) return 'ended';
  if (new Date(ad.startsAt) > now) return 'scheduled';
  if (walletBalanceCents !== null && walletBalanceCents <= 0) return 'nofunds';
  if (ad.totalLimitCents > 0 && ad.totalSpendCents >= ad.totalLimitCents) return 'limit';
  if (spentTodayCents !== null && ad.dailyBudgetCents > 0 && spentTodayCents >= ad.dailyBudgetCents) return 'daily';
  return 'ok';
}

// "Precisam de ajuste/ação": o anunciante tem algo a fazer.
export function needsAction(delivery: Delivery): boolean {
  return delivery === 'rejected' || delivery === 'novideo';
}
