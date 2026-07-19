// Ported from live-show-react's AdvertisementPage.tsx `fmtCents` idea, using
// Intl's built-in currency formatting instead of a hand-rolled "R$ " prefix.
export function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
