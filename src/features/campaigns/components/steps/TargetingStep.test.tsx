import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TargetingStep } from './TargetingStep';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';

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
