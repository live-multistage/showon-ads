import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreativeStep } from './CreativeStep';
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

describe('CreativeStep — format cards filtered by placement', () => {
  it('shows only the page-placement formats for the default 4-placement selection', () => {
    render(<CreativeStep draft={makeDraft()} updateDraft={vi.fn()} setBanner={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Horizontal/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vertical/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tela ampla 16:9/ })).not.toBeInTheDocument();
  });

  it('shows a single 16:9 card for a PLAYER_PAUSE-only selection', () => {
    render(<CreativeStep draft={makeDraft({ placements: ['PLAYER_PAUSE'] })} updateDraft={vi.fn()} setBanner={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Tela ampla 16:9/ })).toBeInTheDocument();
    expect(screen.getByText('mín. 1280×720, ideal 1920×1080')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Horizontal/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Vertical/ })).not.toBeInTheDocument();
  });

  it('shows the 16:9 upload hint when the format is WIDE_16_9', () => {
    render(
      <CreativeStep
        draft={makeDraft({ placements: ['PLAYER_PAUSE'], format: 'WIDE_16_9' })}
        updateDraft={vi.fn()}
        setBanner={vi.fn()}
      />,
    );

    expect(screen.getByText('DIMENSÃO IDEAL: 1920×1080')).toBeInTheDocument();
  });

  it('resets an now-invalid format to null when placements change to make it incompatible', () => {
    const updateDraft = vi.fn();
    const setBanner = vi.fn();
    const { rerender } = render(
      <CreativeStep
        draft={makeDraft({ placements: ['PLAYER_PAUSE'], format: 'WIDE_16_9' })}
        updateDraft={updateDraft}
        setBanner={setBanner}
      />,
    );

    // Advertiser goes back to Targeting and switches to page placements —
    // WIDE_16_9 is no longer accepted, so the format must reset.
    rerender(
      <CreativeStep
        draft={makeDraft({ placements: ['FEED'], format: 'WIDE_16_9' })}
        updateDraft={updateDraft}
        setBanner={setBanner}
      />,
    );

    expect(updateDraft).toHaveBeenCalledWith({ format: null });
    expect(setBanner).toHaveBeenCalledWith(null);
  });

  it('shows the video format card only when PRE_ROLL is the placement', () => {
    const { rerender } = render(
      <CreativeStep draft={makeDraft({ placements: ['PRE_ROLL'] })} updateDraft={vi.fn()} setBanner={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Vídeo 16:9/ })).toBeInTheDocument();

    rerender(<CreativeStep draft={makeDraft({ placements: ['FEED'] })} updateDraft={vi.fn()} setBanner={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Vídeo 16:9/ })).not.toBeInTheDocument();
  });

  it('accepts only mp4 files for VIDEO_16_9', () => {
    render(
      <CreativeStep
        draft={makeDraft({ placements: ['PRE_ROLL'], format: 'VIDEO_16_9' })}
        updateDraft={vi.fn()}
        setBanner={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Banner')).toHaveAttribute('accept', 'video/mp4');
    expect(screen.getByText('MP4 · MÁX 50MB · ATÉ 30s')).toBeInTheDocument();
  });

  it('does not reset the format when it stays compatible with the new placements', () => {
    const updateDraft = vi.fn();
    const { rerender } = render(
      <CreativeStep
        draft={makeDraft({ placements: ['FEED'], format: 'HORIZONTAL_728x90' })}
        updateDraft={updateDraft}
        setBanner={vi.fn()}
      />,
    );

    rerender(
      <CreativeStep
        draft={makeDraft({ placements: ['FEED', 'EVENT_DETAIL'], format: 'HORIZONTAL_728x90' })}
        updateDraft={updateDraft}
        setBanner={vi.fn()}
      />,
    );

    expect(updateDraft).not.toHaveBeenCalled();
  });
});
