export const CONFIRM_TIMEOUT_MS = 30_000;
// O webhook pode creditar antes do redirecionamento chegar, e relógio do
// cliente e do servidor divergem: aceita um TOPUP criado um pouco antes da volta.
const CLOCK_TOLERANCE_MS = 120_000;

export type TopUpConfirmation = 'confirming' | 'confirmed' | 'delayed';

interface Input {
  returnedAtMs: number;
  nowMs: number;
  transactions: ReadonlyArray<{ type: string; createdAt: string }>;
}

// Não existe recarga pendente no backend: "confirmando" é inferido pela
// chegada de um TOPUP depois da volta do Stripe.
export function deriveTopUpConfirmation({ returnedAtMs, nowMs, transactions }: Input): TopUpConfirmation {
  const arrived = transactions.some(
    (t) => t.type === 'TOPUP' && Date.parse(t.createdAt) >= returnedAtMs - CLOCK_TOLERANCE_MS,
  );
  if (arrived) return 'confirmed';
  return nowMs - returnedAtMs >= CONFIRM_TIMEOUT_MS ? 'delayed' : 'confirming';
}
