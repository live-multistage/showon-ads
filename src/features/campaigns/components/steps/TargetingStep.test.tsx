import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TargetingStep } from './TargetingStep';
import { ALL_PLACEMENTS, validateStep, type CampaignWizardDraft } from '../../hooks/use-campaign-wizard';

function makeDraft(overrides: Partial<CampaignWizardDraft> = {}): CampaignWizardDraft {
  return {
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
    placements: ALL_PLACEMENTS,
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
  it('renders a checkbox per placement, all checked by default', () => {
    render(<TargetingStep draft={makeDraft()} updateDraft={vi.fn()} />);

    const checkboxes = screen.getAllByRole('checkbox', {
      name: /feed|página do evento|checkout|pós-compra|pausa do player|pre-roll/i,
    });
    expect(checkboxes).toHaveLength(6);
    checkboxes.forEach((c) => expect(c).toBeChecked());
  });

  it('unchecking a placement removes it from the draft', () => {
    const updateDraft = vi.fn();
    render(<TargetingStep draft={makeDraft()} updateDraft={updateDraft} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Pausa do player' }));

    expect(updateDraft).toHaveBeenCalledWith({
      placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE', 'PRE_ROLL'],
    });
  });

  it('checking a previously-unselected placement adds it back to the draft', () => {
    const updateDraft = vi.fn();
    render(
      <TargetingStep
        draft={makeDraft({ placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE'] })}
        updateDraft={updateDraft}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Pausa do player' }));

    expect(updateDraft).toHaveBeenCalledWith({
      placements: ['FEED', 'EVENT_DETAIL', 'CHECKOUT', 'POST_PURCHASE', 'PLAYER_PAUSE'],
    });
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
