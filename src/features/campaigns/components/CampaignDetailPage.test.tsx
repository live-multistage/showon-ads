import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CampaignDetailPage } from './CampaignDetailPage';
import { useGetAdQuery } from '@/features/advertisements/queries/use-get-ad';
import { useAdReportQuery } from '@/features/advertisements/queries/use-ad-report';
import { useAdReviewsQuery } from '@/features/advertisements/queries/use-ad-reviews';
import { useChangeAdStatusMutation } from '@/features/advertisements/mutations/use-change-ad-status.mutation';
import type { AdResponse, AdReviewEntry } from '@/features/advertisements/types/advertisement.types';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

let mockBalance: number | undefined = 18240;
vi.mock('@/features/settings/queries/use-wallet', () => ({
  useWalletQuery: () => ({ data: mockBalance === undefined ? undefined : { balanceCents: mockBalance, lowBalance: false } }),
}));

vi.mock('@/features/advertisements/queries/use-get-ad', () => ({ useGetAdQuery: vi.fn() }));
vi.mock('@/features/advertisements/queries/use-ad-report', () => ({ useAdReportQuery: vi.fn() }));
vi.mock('@/features/advertisements/queries/use-ad-reviews', () => ({ useAdReviewsQuery: vi.fn() }));

const mockChangeStatusMutate = vi.fn();
vi.mock('@/features/advertisements/mutations/use-change-ad-status.mutation', () => ({
  useChangeAdStatusMutation: vi.fn(),
}));

// EditCampaignForm is exercised in its own test file — mocked here so the
// detail-page suite only needs to assert *that* edit mode is entered/hidden,
// not re-drive the whole reused-wizard-steps form.
vi.mock('./EditCampaignForm', () => ({
  EditCampaignForm: ({ onCancel }: { onCancel: () => void }) => (
    <div>
      <p>Formulário de edição</p>
      <button onClick={onCancel}>Cancelar edição</button>
    </div>
  ),
}));

const mockedUseGetAdQuery = vi.mocked(useGetAdQuery);
const mockedUseAdReportQuery = vi.mocked(useAdReportQuery);
const mockedUseAdReviewsQuery = vi.mocked(useAdReviewsQuery);
const mockedUseChangeAdStatusMutation = vi.mocked(useChangeAdStatusMutation);

function makeAd(overrides: Partial<AdResponse>): AdResponse {
  return {
    id: 'ad-1',
    advertiserAccountId: 'acc-1',
    destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
    title: 'Summer Promo',
    format: 'HORIZONTAL_728x90',
    status: 'DRAFT',
    placements: ['FEED'],
    targetDomains: [],
    targetCategories: [],
    targetAgeBrackets: [],
    bannerUrl: 'https://cdn.example.com/banner.png',
    videoUrl: null,
    videoDurationSec: null,
    pauseVariant: null,
    frequencyCapMax: null,
    frequencyCapWindow: null,
    billingModel: 'CPM',
    bidCents: 100,
    dailyBudgetCents: 1000,
    totalLimitCents: 100000,
    totalSpendCents: 25000,
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-02-01T00:00:00.000Z',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeReview(overrides: Partial<AdReviewEntry>): AdReviewEntry {
  return {
    id: 'rev-1',
    adId: 'ad-1',
    reviewerType: 'AUTOMATED',
    outcome: 'SUBMITTED',
    reason: null,
    reviewedBy: 'system',
    createdAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function mockAd(overrides: Partial<AdResponse>) {
  mockedUseGetAdQuery.mockReturnValue({
    data: makeAd(overrides),
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useGetAdQuery>);
}

function mockReviews(reviews: AdReviewEntry[]) {
  mockedUseAdReviewsQuery.mockReturnValue({
    data: reviews,
    isLoading: false,
  } as unknown as ReturnType<typeof useAdReviewsQuery>);
}

const ZERO_VIDEO = { q25: 0, q50: 0, q75: 0, complete: 0, skip: 0, unmute: 0 };

function mockReport(impressions: number, extra: Record<string, unknown>) {
  mockedUseAdReportQuery.mockReturnValue({
    data: { adId: 'ad-1', title: 'x', status: 'ACTIVE', impressions, clicks: 0, ctr: null, spendCents: 0, dailyBreakdown: [], placementBreakdown: [], video: ZERO_VIDEO, pause: { closed: 0 }, ...extra },
    isLoading: false,
  } as unknown as ReturnType<typeof useAdReportQuery>);
}

const mutateSpy = vi.fn();

describe('CampaignDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBalance = 18240;
    mockedUseAdReportQuery.mockReturnValue({
      data: { adId: 'ad-1', title: 'Summer Promo', status: 'DRAFT', impressions: 1000, clicks: 20, ctr: 2, spendCents: 5000, dailyBreakdown: [], placementBreakdown: [], video: ZERO_VIDEO, pause: { closed: 0 } },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdReportQuery>);
    mockReviews([]);
    mockedUseChangeAdStatusMutation.mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
    } as unknown as ReturnType<typeof useChangeAdStatusMutation>);
  });

  it('shows loading skeletons while the ad is loading', () => {
    mockedUseGetAdQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false } as unknown as ReturnType<
      typeof useGetAdQuery
    >);

    render(<CampaignDetailPage id="ad-1" />);

    expect(screen.getByLabelText('Carregando campanha')).toBeInTheDocument();
  });

  const httpError = (status: number) => ({ isAxiosError: true, response: { status, data: {} }, message: 'x' });

  it('shows a not-found state only for a 404', () => {
    mockedUseGetAdQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: httpError(404) } as unknown as ReturnType<
      typeof useGetAdQuery
    >);

    render(<CampaignDetailPage id="missing" />);

    expect(screen.getByText('Anúncio não encontrado.')).toBeInTheDocument();
  });

  it('a failed load is an error with retry, not "não encontrada"', () => {
    const refetch = vi.fn();
    mockedUseGetAdQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: httpError(500), refetch } as unknown as ReturnType<
      typeof useGetAdQuery
    >);

    render(<CampaignDetailPage id="ad-1" />);

    expect(screen.queryByText('Anúncio não encontrado.')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a campanha.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(refetch).toHaveBeenCalled();
  });

  describe('delivery diagnosis', () => {
    const live = { status: 'ACTIVE' as const, endsAt: '2099-01-01T00:00:00.000Z' };

    it('active with an empty wallet explains the stop and links to the wallet', () => {
      mockBalance = 0;
      mockAd(live);
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('status')).toHaveTextContent('Parada: a carteira está sem saldo');
    });

    it('shows the positive diagnosis while delivering', () => {
      mockAd(live);
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('status')).toHaveTextContent('Entregando normalmente');
    });

    it('under review says it is waiting for the team', () => {
      mockAd({ status: 'REVIEW' });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('status')).toHaveTextContent('Aguardando análise');
    });

    it('a video draft without file says the video is missing', () => {
      mockAd({ status: 'DRAFT', format: 'VIDEO_16_9', placements: ['PRE_ROLL'], bannerUrl: null, videoUrl: null });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('status')).toHaveTextContent('Falta enviar o vídeo');
    });
  });

  describe('video and pause creative', () => {
    it('plays the video of a pre-roll campaign and shows its duration', () => {
      mockAd({ format: 'VIDEO_16_9', placements: ['PRE_ROLL'], bannerUrl: null, videoUrl: 'https://cdn.example.com/v.mp4', videoDurationSec: 20 });
      const { container } = render(<CampaignDetailPage id="ad-1" />);
      expect(container.querySelector('video')).toHaveAttribute('src', 'https://cdn.example.com/v.mp4');
      expect(screen.getByText('20 s')).toBeInTheDocument();
    });

    it('shows the pause image and the variant in the type', () => {
      mockAd({ format: 'WIDE_16_9', placements: ['PLAYER_PAUSE'], pauseVariant: 'FULLSCREEN', bannerUrl: 'https://cdn.example.com/p.webp' });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getAllByText('Pausa · Tela cheia').length).toBeGreaterThan(0);
      expect(screen.getByRole('img', { name: 'Summer Promo' })).toHaveAttribute('src', 'https://cdn.example.com/p.webp');
    });
  });

  describe('submit for review with a video', () => {
    it('is not blocked for a video with an external destination once the video exists', () => {
      mockAd({
        status: 'DRAFT',
        format: 'VIDEO_16_9',
        placements: ['PRE_ROLL'],
        bannerUrl: null,
        videoUrl: 'https://cdn.example.com/v.mp4',
        destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
      });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeEnabled();
    });

    it('is blocked for a video ad without the file', () => {
      mockAd({ status: 'DRAFT', format: 'VIDEO_16_9', placements: ['PRE_ROLL'], bannerUrl: null, videoUrl: null });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeDisabled();
    });

    it('is blocked for a pause ad without the image', () => {
      mockAd({ status: 'DRAFT', format: 'WIDE_16_9', placements: ['PLAYER_PAUSE'], bannerUrl: null });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeDisabled();
    });
  });

  it('renders metrics from the report query', () => {
    mockAd({ status: 'ACTIVE' });
    render(<CampaignDetailPage id="ad-1" />);

    expect(screen.getByText('1.000')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('2.00%')).toBeInTheDocument();
  });

  describe('status action matrix', () => {
    it('DRAFT shows only submit', () => {
      mockAd({ status: 'DRAFT' });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Encerrar' })).not.toBeInTheDocument();
    });

    it('REJECTED shows resubmit', () => {
      mockAd({ status: 'REJECTED' });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.getByRole('button', { name: 'Reenviar para revisão' })).toBeInTheDocument();
    });

    it('REVIEW shows no actions', () => {
      mockAd({ status: 'REVIEW' });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.queryByText('Ações')).not.toBeInTheDocument();
    });

    it('ACTIVE shows pause and end', () => {
      mockAd({ status: 'ACTIVE' });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Encerrar' })).toBeInTheDocument();
    });

    it('PAUSED shows activate and end', () => {
      mockAd({ status: 'PAUSED' });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.getByRole('button', { name: 'Reativar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Encerrar' })).toBeInTheDocument();
    });

    it('ENDED shows no actions', () => {
      mockAd({ status: 'ENDED' });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.queryByText('Ações')).not.toBeInTheDocument();
    });
  });

  it('shows a confirmation dialog before calling end, and only mutates on confirm', () => {
    mockAd({ status: 'ACTIVE' });
    render(<CampaignDetailPage id="ad-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar' }));

    expect(screen.getByText('Encerrar campanha?')).toBeInTheDocument();
    expect(mutateSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar campanha' }));

    expect(mutateSpy).toHaveBeenCalledWith({ adId: 'ad-1', action: 'end' });
  });

  it('shows the rejection reason and an editar e reenviar CTA', () => {
    mockAd({ status: 'REJECTED' });
    mockReviews([makeReview({ outcome: 'REJECT', reason: 'Imagem não segue as diretrizes.' })]);

    render(<CampaignDetailPage id="ad-1" />);

    // Rendered twice by design: once prominently in the rejection banner, and
    // again in the review history timeline below it.
    expect(screen.getAllByText('Imagem não segue as diretrizes.').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Editar e reenviar' })).toBeInTheDocument();
  });

  describe('edit visibility', () => {
    it.each(['DRAFT', 'PAUSED', 'REJECTED'] as const)('shows Editar for %s', (status) => {
      mockAd({ status });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });

    it.each(['ACTIVE', 'REVIEW', 'ENDED'] as const)('hides Editar for %s', (status) => {
      mockAd({ status });
      render(<CampaignDetailPage id="ad-1" />);

      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    });
  });

  it('enters edit mode and can cancel back to the detail view', () => {
    mockAd({ status: 'DRAFT' });
    render(<CampaignDetailPage id="ad-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('Formulário de edição')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar edição' }));
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('blocks submit and shows a destino obrigatório warning for a legacy null-destination ad', () => {
    mockAd({ status: 'DRAFT', destination: null });
    render(<CampaignDetailPage id="ad-1" />);

    const submitButton = screen.getByRole('button', { name: 'Enviar para revisão' });
    expect(submitButton).toBeDisabled();
    // The reason is exposed as the "?" tooltip trigger's accessible name.
    expect(screen.getByRole('button', { name: /destino obrigatório/i })).toBeInTheDocument();

    fireEvent.click(submitButton);
    expect(mutateSpy).not.toHaveBeenCalled();
  });

  it('blocks submit for an EXTERNAL_URL destination with no banner', () => {
    mockAd({ status: 'DRAFT', destination: { type: 'EXTERNAL_URL', url: 'https://example.com' }, bannerUrl: null });
    render(<CampaignDetailPage id="ad-1" />);

    const submitButton = screen.getByRole('button', { name: 'Enviar para revisão' });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByRole('button', {
        name: 'Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.',
      }),
    ).toBeInTheDocument();
  });

  it('allows submit for a DRAFT ad with a valid destination and (if EXTERNAL_URL) a banner', () => {
    mockAd({ status: 'DRAFT', destination: { type: 'EVENT', eventId: 'evt-1' } });
    render(<CampaignDetailPage id="ad-1" />);

    const submitButton = screen.getByRole('button', { name: 'Enviar para revisão' });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(mutateSpy).toHaveBeenCalledWith({ adId: 'ad-1', action: 'submit' });
  });

  it('shows an empty state when there is no placement breakdown yet', () => {
    mockAd({ status: 'ACTIVE' });
    render(<CampaignDetailPage id="ad-1" />);

    expect(screen.getByText('Sem dados de posição ainda.')).toBeInTheDocument();
  });

  it('renders one row per placement with its label and numbers', () => {
    mockAd({ status: 'ACTIVE' });
    mockedUseAdReportQuery.mockReturnValue({
      data: {
        adId: 'ad-1',
        title: 'Summer Promo',
        status: 'ACTIVE',
        impressions: 1000,
        clicks: 20,
        ctr: 2,
        spendCents: 5000,
        dailyBreakdown: [],
        placementBreakdown: [{ placement: 'FEED', impressions: 800, clicks: 15, ctr: 1.88, spendCents: 4000 }],
      },
    } as unknown as ReturnType<typeof useAdReportQuery>);

    render(<CampaignDetailPage id="ad-1" />);

    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
  });

  describe('format-specific stats', () => {
    it('video: shows starts KPI and retention percentages over impressions', () => {
      mockAd({ format: 'VIDEO_16_9' });
      mockReport(200, { video: { q25: 150, q50: 100, q75: 50, complete: 20, skip: 40, unmute: 10 } });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByText('INÍCIOS DO VÍDEO')).toBeInTheDocument();
      expect(screen.queryByText('IMPRESSÕES')).not.toBeInTheDocument();
      const card = within(screen.getByRole('region', { name: 'Retenção do vídeo' }));
      expect(card.getByRole('progressbar', { name: '25%' }).closest('li')).toHaveTextContent('75%150');
      expect(card.getByText('Pularam').closest('div')).toHaveTextContent('20% · 40');
      expect(card.getByText('Ativaram o som').closest('div')).toHaveTextContent('5% · 10');
    });

    it('video: shows a dash instead of dividing by zero', () => {
      mockAd({ format: 'VIDEO_16_9' });
      mockReport(0, {});
      render(<CampaignDetailPage id="ad-1" />);
      const card = within(screen.getByRole('region', { name: 'Retenção do vídeo' }));
      expect(card.getByRole('progressbar', { name: 'Até o fim' }).closest('li')).toHaveTextContent('—');
      expect(card.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    });

    it('pause: shows exhibitions KPI and closed share', () => {
      mockAd({ format: 'WIDE_16_9' });
      mockReport(50, { pause: { closed: 17 } });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByText('EXIBIÇÕES NA PAUSA')).toBeInTheDocument();
      expect(within(screen.getByRole('region', { name: 'Na pausa' })).getByText('Fecharam o anúncio').closest('div')).toHaveTextContent('34% · 17');
      expect(screen.queryByRole('region', { name: 'Retenção do vídeo' })).not.toBeInTheDocument();
    });

    it('banner: shows neither card', () => {
      mockAd({ format: 'HORIZONTAL_728x90' });
      render(<CampaignDetailPage id="ad-1" />);
      expect(screen.getByText('IMPRESSÕES')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Retenção do vídeo' })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Na pausa' })).not.toBeInTheDocument();
    });
  });
});
