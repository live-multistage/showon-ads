import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  draftToCreateAdRequest,
  draftToDestination,
  useCampaignWizard,
  validateExternalUrl,
  type CampaignWizardDraft,
} from './use-campaign-wizard';

describe('validateExternalUrl', () => {
  it('rejects http:// URLs', () => {
    expect(validateExternalUrl('http://example.com')).toBe('A URL deve começar com https://.');
  });

  it('rejects empty values', () => {
    expect(validateExternalUrl('')).toBe('A URL é obrigatória.');
  });

  it('rejects malformed URLs', () => {
    expect(validateExternalUrl('not-a-url')).toBe('Informe uma URL válida.');
  });

  it('rejects URLs longer than 512 chars', () => {
    const longUrl = `https://example.com/${'a'.repeat(512)}`;
    expect(validateExternalUrl(longUrl)).toContain('512 caracteres');
  });

  it('rejects embedded credentials', () => {
    expect(validateExternalUrl('https://user:pass@example.com')).toBe('A URL não pode conter credenciais.');
  });

  it('accepts a plain https URL', () => {
    expect(validateExternalUrl('https://example.com/landing')).toBeNull();
  });
});

// New order: budget -> targeting -> creative (creative + destination merged) -> review.
describe('useCampaignWizard', () => {
  it('starts on the budget step', () => {
    const { result } = renderHook(() => useCampaignWizard());
    expect(result.current.step).toBe('budget');
  });

  // PLAYER_PAUSE is opt-in — combining it with the default page placements
  // would immediately trip the empty-format-intersection rule.
  it('defaults to the 4 page placements, with Pausa do player unchecked', () => {
    const { result } = renderHook(() => useCampaignWizard());
    expect(result.current.draft.placements).toEqual(['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE']);
  });

  function fillValidBudget() {
    return {
      billingModel: 'CPM' as const,
      bidReais: '10',
      dailyBudgetReais: '50',
      totalLimitReais: '500',
      startsAt: '2026-08-01T10:00',
      endsAt: '2026-09-01T10:00',
    };
  }

  it('blocks advancing past budget with a non-positive bid', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.updateDraft({ ...fillValidBudget(), bidReais: '0' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('budget');
    expect(result.current.error).toBe('O lance deve ser maior que zero.');
  });

  it('blocks a total limit lower than the daily budget', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.updateDraft({ ...fillValidBudget(), dailyBudgetReais: '100', totalLimitReais: '50' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('budget');
    expect(result.current.error).toBe('O limite total deve ser maior ou igual ao orçamento diário.');
  });

  it('blocks an end date that is not after the start date', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() =>
      result.current.updateDraft({ ...fillValidBudget(), startsAt: '2026-09-01T10:00', endsAt: '2026-08-01T10:00' }),
    );
    act(() => result.current.next());

    expect(result.current.step).toBe('budget');
    expect(result.current.error).toBe('A data de início deve ser anterior à data de fim.');
  });

  function advanceToTargeting(result: ReturnType<typeof renderHook<ReturnType<typeof useCampaignWizard>, unknown>>['result']) {
    act(() => result.current.updateDraft(fillValidBudget()));
    act(() => result.current.next());
  }

  it('advances to targeting with valid budget inputs', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToTargeting(result);

    expect(result.current.step).toBe('targeting');
    expect(result.current.error).toBeNull();
  });

  it('blocks advancing past targeting when every placement is unchecked', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToTargeting(result);

    act(() => result.current.updateDraft({ placements: [] }));
    act(() => result.current.next());

    expect(result.current.step).toBe('targeting');
    expect(result.current.error).toBe('Selecione pelo menos um posicionamento.');
  });

  it('blocks advancing past targeting when placements have an empty format intersection', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToTargeting(result);

    act(() => result.current.updateDraft({ placements: ['FEED', 'PLAYER_PAUSE'] }));
    act(() => result.current.next());

    expect(result.current.step).toBe('targeting');
    expect(result.current.error).toBe(
      'Pausa do player usa criativo 16:9 e não pode ser combinado com outros posicionamentos.',
    );
  });

  function advanceToCreative(result: ReturnType<typeof renderHook<ReturnType<typeof useCampaignWizard>, unknown>>['result']) {
    advanceToTargeting(result);
    act(() => result.current.next());
  }

  it('advances to the merged creative+destination step from targeting', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    expect(result.current.step).toBe('creative');
  });

  it('blocks advancing past the merged step without a title (creative error first)', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    act(() => result.current.updateDraft({ format: 'HORIZONTAL_728x90' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('Informe um título para a campanha.');
  });

  it('blocks advancing past the merged step without a format', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    act(() => result.current.updateDraft({ title: 'Summer Promo' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('Selecione um formato de anúncio.');
  });

  it('blocks advancing past the merged step without a destination once creative is valid', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    act(() => result.current.updateDraft({ title: 'Summer Promo', format: 'HORIZONTAL_728x90' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('Escolha um destino para o anúncio.');
  });

  it('requires a picked event when destination is EVENT', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    act(() =>
      result.current.updateDraft({ title: 'Summer Promo', format: 'HORIZONTAL_728x90', destinationType: 'EVENT' }),
    );
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('Selecione um evento.');
  });

  it('rejects http:// for the EXTERNAL_URL destination', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    act(() =>
      result.current.updateDraft({
        title: 'Summer Promo',
        format: 'HORIZONTAL_728x90',
        destinationType: 'EXTERNAL_URL',
        externalUrl: 'http://example.com',
      }),
    );
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('A URL deve começar com https://.');
  });

  it('advances to review once creative and destination are both valid', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToCreative(result);

    act(() =>
      result.current.updateDraft({
        title: 'Summer Promo',
        format: 'HORIZONTAL_728x90',
        destinationType: 'EXTERNAL_URL',
        externalUrl: 'https://example.com',
      }),
    );
    act(() => result.current.next());

    expect(result.current.step).toBe('review');
    expect(result.current.error).toBeNull();
  });

  it('surfaces a banner-required warning for EXTERNAL_URL without a staged file', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.updateDraft({ destinationType: 'EXTERNAL_URL' }));
    expect(result.current.bannerRequiredWarning).toBe(
      'Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.',
    );

    act(() => result.current.setBanner(new File(['x'], 'banner.png', { type: 'image/png' })));
    expect(result.current.bannerRequiredWarning).toBeNull();
  });

  it('does not warn for EVENT destinations without a banner', () => {
    const { result } = renderHook(() => useCampaignWizard());
    act(() => result.current.updateDraft({ destinationType: 'EVENT' }));
    expect(result.current.bannerRequiredWarning).toBeNull();
  });

  it('revokes the current banner preview URL on unmount, not the mount-time (null) value', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useCampaignWizard());

    act(() => result.current.setBanner(new File(['x'], 'banner.png', { type: 'image/png' })));
    const previewUrl = result.current.draft.bannerPreviewUrl;
    expect(previewUrl).toBeTruthy();

    unmount();

    expect(revokeSpy).toHaveBeenCalledWith(previewUrl);
    revokeSpy.mockRestore();
  });

  it('back() returns to the previous step and clears the error', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.next()); // blocked, sets an error on budget
    expect(result.current.error).not.toBeNull();

    act(() => result.current.updateDraft(fillValidBudget()));
    act(() => result.current.next()); // -> targeting
    act(() => result.current.back());

    expect(result.current.step).toBe('budget');
    expect(result.current.error).toBeNull();
  });
});

function makeMinimalDraft(overrides: Partial<CampaignWizardDraft>): CampaignWizardDraft {
  return {
    title: 't',
    format: 'HORIZONTAL_728x90',
    bannerFile: null,
    bannerPreviewUrl: null,
    destinationType: null,
    event: null,
    externalUrl: '',
    targetDomains: [],
    targetCategories: [],
    targetAgeBrackets: [],
    placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE', 'PLAYER_PAUSE'],
    billingModel: null,
    bidReais: '',
    dailyBudgetReais: '',
    totalLimitReais: '',
    frequencyCapMax: '',
    frequencyCapWindow: null,
    startsAt: '',
    endsAt: '',
    ...overrides,
  };
}

describe('draftToDestination', () => {
  it('builds an EVENT destination from a picked event', () => {
    const destination = draftToDestination(
      makeMinimalDraft({
        destinationType: 'EVENT',
        event: { id: 'evt-1', title: 'Big Show', bannerUrl: null, thumbnailUrl: null, startsAt: '2026-01-01', status: 'PUBLISHED' },
        externalUrl: '',
      }),
    );
    expect(destination).toEqual({ type: 'EVENT', eventId: 'evt-1' });
  });

  it('builds an EXTERNAL_URL destination from a valid URL', () => {
    const destination = draftToDestination(
      makeMinimalDraft({
        destinationType: 'EXTERNAL_URL',
        event: null,
        externalUrl: 'https://example.com',
      }),
    );
    expect(destination).toEqual({ type: 'EXTERNAL_URL', url: 'https://example.com' });
  });

  it('returns undefined when the destination is incomplete', () => {
    const destination = draftToDestination(
      makeMinimalDraft({
        destinationType: null,
        event: null,
        externalUrl: '',
      }),
    );
    expect(destination).toBeUndefined();
  });
});

describe('draftToCreateAdRequest', () => {
  const baseDraft: CampaignWizardDraft = {
    title: '  Summer Promo  ',
    format: 'HORIZONTAL_728x90',
    bannerFile: null,
    bannerPreviewUrl: null,
    destinationType: 'EXTERNAL_URL',
    event: null,
    externalUrl: 'https://example.com',
    targetDomains: ['ENTERTAINMENT'],
    targetCategories: ['festival'],
    targetAgeBrackets: ['AGE_18_24'],
    placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE', 'PLAYER_PAUSE'],
    billingModel: 'CPM',
    bidReais: '10',
    dailyBudgetReais: '50',
    totalLimitReais: '500',
    frequencyCapMax: '',
    frequencyCapWindow: null,
    startsAt: '2026-08-01T10:00',
    endsAt: '2026-09-01T10:00',
  };

  it('builds a full request with trimmed title, cents conversion and every placement', () => {
    const request = draftToCreateAdRequest(baseDraft, 'acc-1');

    expect(request).toEqual({
      advertiserAccountId: 'acc-1',
      destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
      title: 'Summer Promo',
      format: 'HORIZONTAL_728x90',
      placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE', 'PLAYER_PAUSE'],
      targetDomains: ['ENTERTAINMENT'],
      targetCategories: ['festival'],
      targetAgeBrackets: ['AGE_18_24'],
      frequencyCapMax: undefined,
      frequencyCapWindow: undefined,
      billingModel: 'CPM',
      bidCents: 1000,
      dailyBudgetCents: 5000,
      totalLimitCents: 50000,
      startsAt: new Date('2026-08-01T10:00').toISOString(),
      endsAt: new Date('2026-09-01T10:00').toISOString(),
    });
  });

  it('includes the frequency cap only when a max was set', () => {
    const request = draftToCreateAdRequest(
      { ...baseDraft, frequencyCapMax: '3', frequencyCapWindow: 'day' },
      'acc-1',
    );

    expect(request.frequencyCapMax).toBe(3);
    expect(request.frequencyCapWindow).toBe('day');
  });
});
