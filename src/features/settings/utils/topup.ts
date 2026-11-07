const PRESET_STEPS_CENTS = [5000, 10000, 20000, 50000];

// Presets nunca ficam abaixo do mínimo de recarga. Se o mínimo passa de todos
// os degraus, o próprio mínimo vira a única opção.
export function topUpPresets(minCents: number): number[] {
  const presets = PRESET_STEPS_CENTS.filter((cents) => cents >= minCents);
  return presets.length > 0 ? presets : [minCents];
}

// Aceita "200", "200,50" e "200.50". Vazio ou inválido vira null.
export function parseReaisToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') return null;
  const reais = Number(normalized);
  if (!Number.isFinite(reais) || reais <= 0) return null;
  return Math.round(reais * 100);
}

export type TopUpValidation = { ok: true; cents: number } | { ok: false; reason: 'invalid' | 'belowMin' };

export function validateTopUp(input: string, minCents: number): TopUpValidation {
  const cents = parseReaisToCents(input);
  if (cents === null) return { ok: false, reason: 'invalid' };
  if (cents < minCents) return { ok: false, reason: 'belowMin' };
  return { ok: true, cents };
}
