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

type Wizard = ReturnType<typeof renderHook<ReturnType<typeof useCampaignWizard>, unknown>>['result'];

function validCreative() {
  return {
    title: 'Summer Promo',
    destinationType: 'EXTERNAL_URL' as const,
    externalUrl: 'https://example.com',
  };
}

function validBudget() {
  return {
    billingModel: 'CPM' as const,
    bidReais: '10',
    dailyBudgetReais: '50',
    totalLimitReais: '500',
    startsAt: '2026-08-01T10:00',
    endsAt: '2026-09-01T10:00',
  };
}

function toTargeting(result: Wizard) {
  act(() => result.current.updateDraft(validCreative()));
  act(() => result.current.next());
}

function toBudget(result: Wizard) {
  toTargeting(result);
  act(() => result.current.next());
}

// Order: creative+destination -> where/for whom -> budget+period -> review.
describe('useCampaignWizard', () => {
  it('starts on the creative step, as a banner', () => {
    const { result } = renderHook(() => useCampaignWizard());
    expect(result.current.step).toBe('creative');
    expect(result.current.draft.kind).toBe('banner');
    expect(result.current.draft.format).toBe('HORIZONTAL_728x90');
  });

  it('defaults to the 4 page placements', () => {
    const { result } = renderHook(() => useCampaignWizard());
    expect(result.current.draft.placements).toEqual(['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE']);
  });

  describe('selectKind', () => {
    it('video sets the video format, the pre-roll placement and drops the staged file', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.setBanner(new File(['x'], 'b.png', { type: 'image/png' })));

      act(() => result.current.selectKind('preroll'));

      expect(result.current.draft).toMatchObject({
        kind: 'preroll',
        format: 'VIDEO_16_9',
        placements: ['PRE_ROLL'],
        pauseVariant: null,
        bannerFile: null,
        bannerPreviewUrl: null,
      });
      expect(revokeSpy).toHaveBeenCalled();
      revokeSpy.mockRestore();
    });

    it('pause sets 16:9, the pause placement and defaults to the Padrão variant', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.selectKind('pause'));
      expect(result.current.draft).toMatchObject({
        kind: 'pause',
        format: 'WIDE_16_9',
        placements: ['PLAYER_PAUSE'],
        pauseVariant: 'STANDARD',
      });
    });

    it('going back to banner restores the page placements and clears the variant', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.selectKind('pause'));
      act(() => result.current.selectKind('banner'));
      expect(result.current.draft).toMatchObject({
        kind: 'banner',
        format: 'HORIZONTAL_728x90',
        placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE'],
        pauseVariant: null,
      });
    });

    it('picking the current type keeps the staged file', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.setBanner(new File(['x'], 'b.png', { type: 'image/png' })));
      act(() => result.current.selectKind('banner'));
      expect(result.current.draft.bannerFile).not.toBeNull();
    });
  });

  describe('creative + destination step', () => {
    it('blocks without a title', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.next());
      expect(result.current.step).toBe('creative');
      expect(result.current.error).toBe('Informe um título para a campanha.');
    });

    it('blocks without a destination once the title is set', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.updateDraft({ title: 'Summer Promo' }));
      act(() => result.current.next());
      expect(result.current.error).toBe('Escolha um destino para o anúncio.');
    });

    it('requires a picked event when the destination is EVENT', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.updateDraft({ title: 'Summer Promo', destinationType: 'EVENT' }));
      act(() => result.current.next());
      expect(result.current.error).toBe('Selecione um evento.');
    });

    it('rejects http:// for the EXTERNAL_URL destination', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() =>
        result.current.updateDraft({ ...validCreative(), externalUrl: 'http://example.com' }),
      );
      act(() => result.current.next());
      expect(result.current.step).toBe('creative');
      expect(result.current.error).toBe('A URL deve começar com https://.');
    });

    it('a pause campaign needs a variant', () => {
      const { result } = renderHook(() => useCampaignWizard());
      act(() => result.current.selectKind('pause'));
      act(() => result.current.updateDraft({ ...validCreative(), pauseVariant: null }));
      act(() => result.current.next());
      expect(result.current.error).toBe('Escolha a variante da pausa.');
    });

    it('advances to targeting when valid', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toTargeting(result);
      expect(result.current.step).toBe('targeting');
      expect(result.current.error).toBeNull();
    });
  });

  describe('targeting step', () => {
    it('blocks when every position is unchecked', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toTargeting(result);
      act(() => result.current.updateDraft({ placements: [] }));
      act(() => result.current.next());
      expect(result.current.step).toBe('targeting');
      expect(result.current.error).toBe('Selecione pelo menos um posicionamento.');
    });

    it('blocks placements with an empty format intersection', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toTargeting(result);
      act(() => result.current.updateDraft({ placements: ['FEED', 'PLAYER_PAUSE'] }));
      act(() => result.current.next());
      expect(result.current.error).toBe(
        'Os posicionamentos selecionados não podem ser combinados, pois usam formatos incompatíveis.',
      );
    });

    it('advances to budget', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toBudget(result);
      expect(result.current.step).toBe('budget');
    });
  });

  describe('budget step', () => {
    it('blocks a non-positive bid', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toBudget(result);
      act(() => result.current.updateDraft({ ...validBudget(), bidReais: '0' }));
      act(() => result.current.next());
      expect(result.current.step).toBe('budget');
      expect(result.current.error).toBe('O lance deve ser maior que zero.');
    });

    it('blocks a total limit lower than the daily budget', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toBudget(result);
      act(() => result.current.updateDraft({ ...validBudget(), dailyBudgetReais: '100', totalLimitReais: '50' }));
      act(() => result.current.next());
      expect(result.current.error).toBe('O limite total deve ser maior ou igual ao orçamento diário.');
    });

    it('blocks an end date that is not after the start date', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toBudget(result);
      act(() =>
        result.current.updateDraft({ ...validBudget(), startsAt: '2026-09-01T10:00', endsAt: '2026-08-01T10:00' }),
      );
      act(() => result.current.next());
      expect(result.current.error).toBe('A data de início deve ser anterior à data de fim.');
    });

    it('advances to review when valid', () => {
      const { result } = renderHook(() => useCampaignWizard());
      toBudget(result);
      act(() => result.current.updateDraft(validBudget()));
      act(() => result.current.next());
      expect(result.current.step).toBe('review');
      expect(result.current.error).toBeNull();
    });
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
    toTargeting(result);
    act(() => result.current.updateDraft({ placements: [] }));
    act(() => result.current.next()); // blocked
    expect(result.current.error).not.toBeNull();

    act(() => result.current.back());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBeNull();
  });

  it('goToStep only jumps backward', () => {
    const { result } = renderHook(() => useCampaignWizard());
    toBudget(result);
    act(() => result.current.goToStep('creative'));
    expect(result.current.step).toBe('creative');
    act(() => result.current.goToStep('budget'));
    expect(result.current.step).toBe('creative');
  });
});

function makeMinimalDraft(overrides: Partial<CampaignWizardDraft>): CampaignWizardDraft {
  return {
    kind: 'banner',
    pauseVariant: null,
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
    kind: 'banner',
    pauseVariant: null,
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
      pauseVariant: undefined,
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

  it('sends the pause variant for a pause campaign and omits it otherwise', () => {
    const pause = draftToCreateAdRequest(
      { ...baseDraft, kind: 'pause', format: 'WIDE_16_9', placements: ['PLAYER_PAUSE'], pauseVariant: 'FULLSCREEN' },
      'acc-1',
    );
    expect(pause.pauseVariant).toBe('FULLSCREEN');
    expect(draftToCreateAdRequest(baseDraft, 'acc-1').pauseVariant).toBeUndefined();
  });
});
