import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TargetingStep } from './TargetingStep';
import { draftPatchForKind, validateStep, type CampaignWizardDraft } from '../../hooks/use-campaign-wizard';

function makeDraft(overrides: Partial<CampaignWizardDraft> = {}): CampaignWizardDraft {
  return {
    kind: 'banner',
    pauseVariant: null,
    title: '',
    format: null,
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

describe('TargetingStep — age brackets', () => {
  it('shows the "all ages" hint when none are selected', () => {
    render(<TargetingStep draft={makeDraft()} updateDraft={vi.fn()} />);

    expect(
      screen.getByText('Todas as idades — nenhuma faixa etária selecionada restringe a exibição.'),
    ).toBeInTheDocument();
  });

  it('never renders the 13-17 bracket (not advertiser-selectable)', () => {
    render(<TargetingStep draft={makeDraft()} updateDraft={vi.fn()} />);

    expect(screen.queryByRole('button', { name: '13–17' })).not.toBeInTheDocument();
  });

  it('adds a bracket to the draft on toggle', () => {
    const updateDraft = vi.fn();
    render(<TargetingStep draft={makeDraft()} updateDraft={updateDraft} />);

    fireEvent.click(screen.getByRole('button', { name: '25–34' }));

    expect(updateDraft).toHaveBeenCalledWith({ targetAgeBrackets: ['AGE_25_34'] });
  });

  it('removes an already-selected bracket on toggle', () => {
    const updateDraft = vi.fn();
    render(
      <TargetingStep
        draft={makeDraft({ targetAgeBrackets: ['AGE_25_34', 'AGE_35_44'] })}
        updateDraft={updateDraft}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '25–34' }));

    expect(updateDraft).toHaveBeenCalledWith({ targetAgeBrackets: ['AGE_35_44'] });
  });

  it('shows the restriction hint once a bracket is selected', () => {
    render(<TargetingStep draft={makeDraft({ targetAgeBrackets: ['AGE_18_24'] })} updateDraft={vi.fn()} />);

    expect(
      screen.getByText('Seu anúncio será exibido apenas para as faixas etárias selecionadas.'),
    ).toBeInTheDocument();
  });
});

describe('TargetingStep — placements', () => {
  it('banner: one checkbox per page position, all checked by default', () => {
    render(<TargetingStep draft={makeDraft()} updateDraft={vi.fn()} />);

    const checkboxes = screen.getAllByRole('checkbox', { name: /feed|página do evento|checkout|pós-compra/i });
    expect(checkboxes).toHaveLength(4);
    checkboxes.forEach((c) => expect(c).toBeChecked());
    expect(screen.queryByRole('checkbox', { name: 'Pausa do player' })).toBeNull();
  });

  it('banner: unchecking a position removes it from the draft', () => {
    const updateDraft = vi.fn();
    render(<TargetingStep draft={makeDraft()} updateDraft={updateDraft} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Checkout' }));

    expect(updateDraft).toHaveBeenCalledWith({ placements: ['FEED', 'EVENT_DETAIL', 'POST_PURCHASE'] });
  });

  it('video: shows where it runs instead of position checkboxes', () => {
    render(<TargetingStep draft={makeDraft(draftPatchForKind('preroll'))} updateDraft={vi.fn()} />);

    expect(screen.queryByRole('checkbox', { name: 'Feed' })).toBeNull();
    expect(screen.getByText('Antes do vídeo')).toBeInTheDocument();
    expect(screen.getByText('Só quem tem acesso à transmissão chega a ver o vídeo.')).toBeInTheDocument();
  });

  it('pause: shows the player position', () => {
    render(<TargetingStep draft={makeDraft(draftPatchForKind('pause'))} updateDraft={vi.fn()} />);

    expect(screen.getByText('Pausa no player')).toBeInTheDocument();
    expect(screen.getByText('Depois de 2 s de pausa, a cada pausa')).toBeInTheDocument();
  });
});

describe('validateStep — targeting', () => {
  it('rejects a draft with zero placements selected', () => {
    expect(validateStep('targeting', makeDraft({ placements: [] }))).toBe(
      'Selecione pelo menos um posicionamento.',
    );
  });

  it('accepts a draft with at least one placement selected', () => {
    expect(validateStep('targeting', makeDraft({ placements: ['FEED'] }))).toBeNull();
  });

  it('accepts PLAYER_PAUSE alone (its own 16:9-only format)', () => {
    expect(validateStep('targeting', makeDraft({ placements: ['PLAYER_PAUSE'] }))).toBeNull();
  });

  it('rejects PLAYER_PAUSE combined with a page placement (empty format intersection)', () => {
    expect(validateStep('targeting', makeDraft({ placements: ['FEED', 'PLAYER_PAUSE'] }))).toBe(
      'Os posicionamentos selecionados não podem ser combinados, pois usam formatos incompatíveis.',
    );
  });

  it('accepts every page placement combined (they share the same two formats)', () => {
    expect(
      validateStep('targeting', makeDraft({ placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE'] })),
    ).toBeNull();
  });
});
