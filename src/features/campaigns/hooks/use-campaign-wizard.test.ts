import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { draftToDestination, useCampaignWizard, validateExternalUrl } from './use-campaign-wizard';

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

describe('useCampaignWizard', () => {
  it('starts on the creative step', () => {
    const { result } = renderHook(() => useCampaignWizard());
    expect(result.current.step).toBe('creative');
  });

  it('blocks advancing past creative without a title', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.updateDraft({ format: 'HORIZONTAL_728x90' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('Informe um título para a campanha.');
  });

  it('blocks advancing past creative without a format', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.updateDraft({ title: 'Summer Promo' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBe('Selecione um formato de anúncio.');
  });

  it('advances to destination once title and format are set', () => {
    const { result } = renderHook(() => useCampaignWizard());

    act(() => result.current.updateDraft({ title: 'Summer Promo', format: 'HORIZONTAL_728x90' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('destination');
    expect(result.current.error).toBeNull();
  });

  function advanceToDestination(result: ReturnType<typeof renderHook<ReturnType<typeof useCampaignWizard>, unknown>>['result']) {
    act(() => result.current.updateDraft({ title: 'Summer Promo', format: 'HORIZONTAL_728x90' }));
    act(() => result.current.next());
  }

  it('requires a picked event when destination is EVENT', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToDestination(result);

    act(() => result.current.updateDraft({ destinationType: 'EVENT' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('destination');
    expect(result.current.error).toBe('Selecione um evento.');
  });

  it('advances once an event is picked', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToDestination(result);

    act(() =>
      result.current.updateDraft({
        destinationType: 'EVENT',
        event: { id: 'evt-1', title: 'Big Show', bannerUrl: null, thumbnailUrl: null, startsAt: '2026-01-01', status: 'PUBLISHED' },
      }),
    );
    act(() => result.current.next());

    expect(result.current.step).toBe('targeting');
  });

  it('rejects http:// for the EXTERNAL_URL destination', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToDestination(result);

    act(() => result.current.updateDraft({ destinationType: 'EXTERNAL_URL', externalUrl: 'http://example.com' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('destination');
    expect(result.current.error).toBe('A URL deve começar com https://.');
  });

  it('advances for a valid https URL', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToDestination(result);

    act(() => result.current.updateDraft({ destinationType: 'EXTERNAL_URL', externalUrl: 'https://example.com' }));
    act(() => result.current.next());

    expect(result.current.step).toBe('targeting');
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

  it('back() returns to the previous step and clears the error', () => {
    const { result } = renderHook(() => useCampaignWizard());
    advanceToDestination(result);

    act(() => result.current.next()); // blocked, sets an error
    expect(result.current.error).not.toBeNull();

    act(() => result.current.back());
    expect(result.current.step).toBe('creative');
    expect(result.current.error).toBeNull();
  });
});

describe('draftToDestination', () => {
  it('builds an EVENT destination from a picked event', () => {
    const destination = draftToDestination({
      title: 't',
      format: 'HORIZONTAL_728x90',
      bannerFile: null,
      bannerPreviewUrl: null,
      destinationType: 'EVENT',
      event: { id: 'evt-1', title: 'Big Show', bannerUrl: null, thumbnailUrl: null, startsAt: '2026-01-01', status: 'PUBLISHED' },
      externalUrl: '',
    });
    expect(destination).toEqual({ type: 'EVENT', eventId: 'evt-1' });
  });

  it('builds an EXTERNAL_URL destination from a valid URL', () => {
    const destination = draftToDestination({
      title: 't',
      format: 'HORIZONTAL_728x90',
      bannerFile: null,
      bannerPreviewUrl: null,
      destinationType: 'EXTERNAL_URL',
      event: null,
      externalUrl: 'https://example.com',
    });
    expect(destination).toEqual({ type: 'EXTERNAL_URL', url: 'https://example.com' });
  });

  it('returns undefined when the destination is incomplete', () => {
    const destination = draftToDestination({
      title: 't',
      format: 'HORIZONTAL_728x90',
      bannerFile: null,
      bannerPreviewUrl: null,
      destinationType: null,
      event: null,
      externalUrl: '',
    });
    expect(destination).toBeUndefined();
  });
});
