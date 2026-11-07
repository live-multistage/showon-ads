// Converte o que a pessoa digita num campo de reais em um número de reais.
// Aceita "1.500,00", "1500,00", "1500", "200,50", "200.5" e "R$ 50".
// Ponto seguido de exatamente três dígitos é milhar ("1.500"); o resto é decimal.
export function parseBrl(input: string): number | null {
  const cleaned = input.replace(/R\$/gi, '').replace(/\s/g, '');
  if (cleaned === '') return null;

  let normalized: string;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  } else {
    normalized = cleaned;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const reais = Number(normalized);
  return Number.isFinite(reais) ? reais : null;
}

export function parseBrlToCents(input: string): number | null {
  const reais = parseBrl(input);
  return reais === null ? null : Math.round(reais * 100);
}

// Custo de uma impressão num lance por mil, em reais com 4 casas: a fração de
// centavo é acumulada pelo backend e descontada da carteira em centavos inteiros.
export function formatCostPerImpression(bidCentsPerThousand: number): string {
  return (bidCentsPerThousand / 100_000).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}
