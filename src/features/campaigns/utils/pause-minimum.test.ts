import { describe, it, expect } from 'vitest';
import { pauseMinimumLabel as label } from './pause-minimum';

// Intl separa "R$" e o valor com espaço sem quebra.
const pauseMinimumLabel = (...args: Parameters<typeof label>) => label(...args)?.replace(/\u00a0/g, ' ') ?? null;

const mins = { STANDARD: { CPM: 800, CPC: 40 }, FULLSCREEN: { CPM: 1400, CPC: 70 } };

describe('pauseMinimumLabel', () => {
  it('CPM fullscreen', () => expect(pauseMinimumLabel('FULLSCREEN', 'CPM', mins)).toBe('R$ 14,00 por mil · Tela cheia'));
  it('CPC standard', () => expect(pauseMinimumLabel('STANDARD', 'CPC', mins)).toBe('R$ 0,40 por clique · Padrão'));
  it('null without a variant (not a pause)', () => expect(pauseMinimumLabel(null, 'CPM', mins)).toBeNull());
  it('null until settings arrive', () => expect(pauseMinimumLabel('STANDARD', 'CPM', undefined)).toBeNull());
  it('null without billing model', () => expect(pauseMinimumLabel('STANDARD', null, mins)).toBeNull());
});
