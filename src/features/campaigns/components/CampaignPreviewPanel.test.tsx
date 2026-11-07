import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CampaignWizardDraft } from '../hooks/use-campaign-wizard';
import { CampaignPreviewPanel } from './CampaignPreviewPanel';

const BANNER_DRAFT: CampaignWizardDraft = {
  kind: 'banner',
  pauseVariant: null,
  title: 'Gelada',
  format: 'HORIZONTAL_728x90',
  bannerFile: null,
  bannerPreviewUrl: null,
  destinationType: null,
  event: null,
  externalUrl: '',
  targetDomains: [],
  targetCategories: [],
  targetAgeBrackets: [],
  placements: [],
  billingModel: null,
  bidReais: '',
  dailyBudgetReais: '',
  totalLimitReais: '',
  frequencyCapMax: '',
  frequencyCapWindow: null,
  startsAt: '',
  endsAt: '',
};

describe('CampaignPreviewPanel', () => {
  it('renders the banner preview and tips without a reach estimate', () => {
    render(<CampaignPreviewPanel draft={BANNER_DRAFT} />);
    expect(screen.getByText('PRÉ-VISUALIZAÇÃO')).toBeInTheDocument();
    expect(screen.getByText('DICAS PARA APROVAÇÃO')).toBeInTheDocument();
    expect(screen.queryByText(/ESTIMATIVA/)).toBeNull();
    expect(screen.queryByText(/impress(ão|ões)/)).toBeNull();
  });

  it('does not show an estimate for the player preview either', () => {
    render(<CampaignPreviewPanel draft={{ ...BANNER_DRAFT, kind: 'preroll', format: 'VIDEO_16_9' }} />);
    expect(screen.getByText('PRÉVIA NO PLAYER')).toBeInTheDocument();
    expect(screen.queryByText(/ESTIMATIVA/)).toBeNull();
    expect(screen.queryByText(/impress(ão|ões)/)).toBeNull();
  });
});
