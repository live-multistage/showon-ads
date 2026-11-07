import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreativeStep } from './CreativeStep';
import { draftPatchForKind, type CampaignWizardDraft } from '../../hooks/use-campaign-wizard';

function makeDraft(overrides: Partial<CampaignWizardDraft> = {}): CampaignWizardDraft {
  return {
    kind: 'banner',
    pauseVariant: null,
    title: '',
    format: 'HORIZONTAL_728x90',
    bannerFile: null,
    bannerPreviewUrl: null,
    destinationType: null,
    event: null,
    externalUrl: '',
    targetDomains: [],
    targetCategories: [],
    targetAgeBrackets: [],
    placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE'],
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

const pauseDraft = (o: Partial<CampaignWizardDraft> = {}) => makeDraft({ ...draftPatchForKind('pause'), ...o });
const prerollDraft = (o: Partial<CampaignWizardDraft> = {}) => makeDraft({ ...draftPatchForKind('preroll'), ...o });

function renderStep(draft: CampaignWizardDraft, props: Partial<React.ComponentProps<typeof CreativeStep>> = {}) {
  const handlers = { updateDraft: vi.fn(), selectKind: vi.fn(), setBanner: vi.fn() };
  render(<CreativeStep draft={draft} {...handlers} {...props} />);
  return handlers;
}

describe('CreativeStep — type of ad', () => {
  it('offers the three ad types and marks the current one', () => {
    renderStep(makeDraft());
    expect(screen.getByRole('button', { name: /Banner nas páginas/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Vídeo antes da transmissão/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /Anúncio na pausa/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('picking a type calls selectKind', () => {
    const { selectKind } = renderStep(makeDraft());
    fireEvent.click(screen.getByRole('button', { name: /Anúncio na pausa/ }));
    expect(selectKind).toHaveBeenCalledWith('pause');
  });

  it('locks the other types while editing an existing campaign', () => {
    renderStep(makeDraft(), { lockKind: true });
    expect(screen.getByRole('button', { name: /Vídeo antes da transmissão/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Banner nas páginas/ })).toBeEnabled();
  });
});

describe('CreativeStep — banner', () => {
  it('offers the two sizes and updates the format', () => {
    const { updateDraft } = renderStep(makeDraft());
    fireEvent.click(screen.getByRole('button', { name: 'Vertical 300×600' }));
    expect(updateDraft).toHaveBeenCalledWith({ format: 'VERTICAL_300x600' });
  });

  it('accepts images and hints at the ideal dimension', () => {
    renderStep(makeDraft());
    expect(screen.getByLabelText('Banner')).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp');
    expect(screen.getByText('DIMENSÃO IDEAL: 728×90')).toBeInTheDocument();
  });

  it('says the title is only for the advertiser', () => {
    renderStep(makeDraft());
    expect(screen.getByText('Só você vê. Aparece no Ads Manager e nos relatórios.')).toBeInTheDocument();
  });
});

describe('CreativeStep — pause', () => {
  it('shows the two variants and picks one', () => {
    const { updateDraft } = renderStep(pauseDraft());
    expect(screen.getByRole('button', { name: /Padrão/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Tela cheia/ }));
    expect(updateDraft).toHaveBeenCalledWith({ pauseVariant: 'FULLSCREEN' });
  });

  it('warns that mobile is always fullscreen', () => {
    renderStep(pauseDraft());
    expect(screen.getByText(/No celular, a pausa é sempre Tela cheia/)).toBeInTheDocument();
  });

  it('shows the 16:9 upload hint and the public-title hint', () => {
    renderStep(pauseDraft());
    expect(screen.getByText('DIMENSÃO IDEAL: 1920×1080')).toBeInTheDocument();
    expect(screen.getByText('O público vê: é o título grande ao lado do player.')).toBeInTheDocument();
  });
});

describe('CreativeStep — video', () => {
  it('accepts only mp4 files', () => {
    renderStep(prerollDraft());
    expect(screen.getByLabelText('Banner')).toHaveAttribute('accept', 'video/mp4');
    expect(screen.getByText('MP4 · MÁX 50MB · ATÉ 30s')).toBeInTheDocument();
  });

  it('says the title becomes the action button over the video', () => {
    renderStep(prerollDraft());
    expect(screen.getByText('O público vê: vira o botão de ação sobre o vídeo.')).toBeInTheDocument();
  });

  it('rejects an mp4 over 50MB and does not stage it, but accepts a normal-size one', () => {
    const { setBanner } = renderStep(prerollDraft());
    const input = screen.getByLabelText('Banner');

    const oversized = new File([''], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(oversized, 'size', { value: 52_428_801 });
    fireEvent.change(input, { target: { files: [oversized] } });

    expect(screen.getByRole('alert')).toHaveTextContent('O vídeo deve ter no máximo 50MB.');
    expect(setBanner).not.toHaveBeenCalled();

    const ok = new File([''], 'ok.mp4', { type: 'video/mp4' });
    Object.defineProperty(ok, 'size', { value: 52_428_800 });
    fireEvent.change(input, { target: { files: [ok] } });

    expect(setBanner).toHaveBeenCalledWith(ok);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
