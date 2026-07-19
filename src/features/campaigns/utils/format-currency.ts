// Ported from live-show-react's AdvertisementPage.tsx `fmtCents` idea, using
// Intl's built-in currency formatting instead of a hand-rolled "R$ " prefix.
export function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Inverse of the above — the budget step collects reais in plain number
// inputs (per AdCreatePage.tsx's slider convention) and the API contract
// wants integer cents. Invalid/empty input becomes 0 so callers can rely on
// a number and let the domain's positivity checks reject it.
export function reaisToCents(reais: string): number {
  const parsed = Number(reais);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

// Inverse direction for the edit form: seeds a plain-number-input value
// (type="number", e.g. "10.5") from cents stored server-side. Cents are
// always integers so /100 has at most 2 decimal digits — no rounding needed.
export function centsToReaisInput(cents: number): string {
  return (cents / 100).toString();
}
