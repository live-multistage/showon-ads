import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampaignWizard } from './CampaignWizard';
import { eventsService } from '@/features/advertisements/services/events.service';
import type { EventSearchResponse } from '@/features/advertisements/types/event-search.types';

vi.mock('@/features/advertisements/services/events.service', () => ({
  eventsService: {
    search: vi.fn(),
  },
}));

const mockSettings = {
  data: {
    minTopupCents: 5000,
    lowBalanceThresholdCents: 2000,
    pauseMinBids: { STANDARD: { CPM: 800, CPC: 40 }, FULLSCREEN: { CPM: 1400, CPC: 70 } },
  } as { minTopupCents: number; lowBalanceThresholdCents: number; pauseMinBids: unknown } | undefined,
};
let mockBalanceCents: number | undefined = 18240;
vi.mock('@/features/settings/queries/use-wallet', () => ({
  useAdvertiserSettingsQuery: () => mockSettings,
  useWalletQuery: () => ({ data: mockBalanceCents === undefined ? undefined : { balanceCents: mockBalanceCents, lowBalance: false } }),
}));

vi.mock('@/features/advertisers/providers/ActiveAdvertiserAccountProvider', () => ({
  useActiveAdvertiserAccount: () => ({
    accounts: [],
    activeAccountId: 'acc-1',
    setActiveAccountId: vi.fn(),
    isLoading: false,
  }),
}));

const mockCreateAdMutateAsync = vi.fn();
const mockUploadBannerMutateAsync = vi.fn();
const mockUploadVideoMutateAsync = vi.fn();
const mockChangeStatusMutateAsync = vi.fn();

vi.mock('@/features/advertisements/mutations/use-create-ad.mutation', () => ({
  useCreateAdMutation: () => ({ mutateAsync: mockCreateAdMutateAsync, isPending: false }),
}));
vi.mock('@/features/advertisements/mutations/use-upload-banner.mutation', () => ({
  useUploadBannerMutation: () => ({ mutateAsync: mockUploadBannerMutateAsync, isPending: false }),
}));
vi.mock('@/features/advertisements/mutations/use-upload-video.mutation', () => ({
  useUploadVideoMutation: () => ({ mutateAsync: mockUploadVideoMutateAsync, isPending: false }),
}));
vi.mock('@/features/advertisements/mutations/use-change-ad-status.mutation', () => ({
  useChangeAdStatusMutation: () => ({ mutateAsync: mockChangeStatusMutateAsync, isPending: false }),
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const mockedEventsService = vi.mocked(eventsService, true);

// O wizard monta várias telas por teste; sob carga da suíte inteira 5 s não bastam.
vi.setConfig({ testTimeout: 20_000 });

// Wizard order: creative + destination -> where/for whom -> budget + period -> review.
describe('CampaignWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockBalanceCents = 18240;
    mockCreateAdMutateAsync.mockResolvedValue({ id: 'ad-1' });
    mockUploadBannerMutateAsync.mockResolvedValue('https://cdn.example.com/banner.png');
    mockUploadVideoMutateAsync.mockResolvedValue({ videoUrl: 'https://cdn.example.com/video.mp4', videoDurationSec: 15 });
    mockChangeStatusMutateAsync.mockResolvedValue(undefined);
  });

  const next = () => fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

  function fillBudgetStep({
    bid = '10',
    daily = '50',
    total = '1.500,00',
    starts = '2026-08-01T10:00',
    ends = '2026-09-01T10:00',
    model = /CPM/,
  }: { bid?: string; daily?: string; total?: string; starts?: string; ends?: string; model?: RegExp } = {}) {
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: model }));
    fireEvent.change(screen.getByLabelText(/^Lance por/), { target: { value: bid } });
    fireEvent.change(screen.getByLabelText('Orçamento diário (R$)'), { target: { value: daily } });
    fireEvent.change(screen.getByLabelText('Limite total de gasto (R$)'), { target: { value: total } });
    fireEvent.change(screen.getByLabelText('Início da veiculação'), { target: { value: starts } });
    fireEvent.change(screen.getByLabelText('Fim da veiculação'), { target: { value: ends } });
  }

  function fillCreativeFields() {
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
  }

  function fillExternalUrlDestination(url = 'https://example.com/landing') {
    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: url } });
  }

  function advanceToTargeting() {
    fillCreativeFields();
    fillExternalUrlDestination();
    next();
  }

  function advanceToBudget() {
    advanceToTargeting();
    next();
  }

  function advanceToReview() {
    advanceToBudget();
    fillBudgetStep();
    next();
  }

  it('starts on the creative step with the type cards and the 4-step stepper', () => {
    render(<CampaignWizard />);
    expect(screen.getByRole('button', { name: /Banner nas páginas/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('navigation', { name: 'Etapas da campanha' })).toHaveTextContent('Onde e para quem');
    expect(screen.getByRole('navigation', { name: 'Etapas da campanha' })).toHaveTextContent('Orçamento e período');
  });

  it('cannot advance the creative step without a title', () => {
    render(<CampaignWizard />);
    next();
    expect(screen.getByText('Informe um título para a campanha.')).toBeInTheDocument();
  });

  it('rejects http:// for the EXTERNAL_URL destination', () => {
    render(<CampaignWizard />);
    fillCreativeFields();
    fillExternalUrlDestination('http://example.com');
    next();
    expect(screen.getByText('A URL deve começar com https://.')).toBeInTheDocument();
  });

  it('advances to targeting once creative and destination are valid', () => {
    render(<CampaignWizard />);
    advanceToTargeting();
    expect(screen.getByText('Interesses do público')).toBeInTheDocument();
  });

  it('blocks advancing past targeting when every position is unchecked', () => {
    render(<CampaignWizard />);
    advanceToTargeting();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Feed' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Página do evento' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Checkout' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pós-compra' }));
    next();

    expect(screen.getByText('Selecione pelo menos um posicionamento.')).toBeInTheDocument();
  });

  it('cannot advance the budget step with a non-positive bid', () => {
    render(<CampaignWizard />);
    advanceToBudget();
    fillBudgetStep({ bid: '0' });
    next();
    expect(screen.getByText('O lance deve ser maior que zero.')).toBeInTheDocument();
  });

  it('shows the cost per impression with four decimals for a CPM bid', () => {
    render(<CampaignWizard />);
    advanceToBudget();
    fillBudgetStep({ bid: '12' });
    expect(screen.getByText(/R\$\s?0,0120/)).toBeInTheDocument();
  });

  it('understands the thousands separator in the money fields', () => {
    render(<CampaignWizard />);
    advanceToReview();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
  });

  it('pause: shows the minimum per variant and blocks a bid under the chosen variant minimum', () => {
    render(<CampaignWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Anúncio na pausa/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tela cheia/ }));
    fillCreativeFields();
    fillExternalUrlDestination();
    next(); // -> targeting
    next(); // -> budget

    expect(screen.getByText('Padrão')).toBeInTheDocument();
    expect(screen.getByText(/Tela cheia · sua escolha/)).toBeInTheDocument();

    fillBudgetStep({ bid: '10' });
    expect(screen.getByRole('alert')).toHaveTextContent('O lance mínimo da pausa Tela cheia é R$ 14,00 por mil exibições.');
    next();
    expect(screen.queryByRole('button', { name: 'Enviar para análise' })).toBeNull();
    expect(screen.getByText('Orçamento e período', { selector: 'h2' })).toBeInTheDocument();
  });

  it('pause: a bid equal to the variant minimum passes', () => {
    render(<CampaignWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Anúncio na pausa/ }));
    fillCreativeFields();
    fillExternalUrlDestination();
    next();
    next();
    fillBudgetStep({ bid: '8,00' });
    next();
    expect(screen.getByRole('button', { name: 'Enviar para análise' })).toBeInTheDocument();
  });

  it('review: shows the grouped summary with the wallet balance and how many days it covers', () => {
    render(<CampaignWizard />);
    advanceToReview();

    expect(screen.getByText('Summer Promo')).toBeInTheDocument();
    expect(screen.getByText('Banner Horizontal 728×90')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/landing')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?10,00 por mil impressões/)).toBeInTheDocument();
    expect(screen.getByText(/Saldo de R\$\s?182,40 na carteira/)).toBeInTheDocument();
    expect(screen.getByText(/Cobre cerca de 3 dias do orçamento diário de R\$\s?50,00/)).toBeInTheDocument();
  });

  it('review: warns but still allows sending when the wallet is empty', () => {
    mockBalanceCents = 0;
    render(<CampaignWizard />);
    advanceToReview();
    expect(screen.getByText('Sua carteira está sem saldo.')).toBeInTheDocument();
  });

  it('review: "Editar" jumps back to that step', () => {
    render(<CampaignWizard />);
    advanceToReview();
    fireEvent.click(screen.getByRole('button', { name: 'Editar Onde e para quem' }));
    expect(screen.getByText('Interesses do público')).toBeInTheDocument();
  });

  it('shows the banner-required warning for EXTERNAL_URL without a staged file', () => {
    render(<CampaignWizard />);
    fillCreativeFields();
    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));

    expect(
      screen.getByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).toBeInTheDocument();
  });

  it('does not show the banner-required warning for the EVENT destination', () => {
    render(<CampaignWizard />);
    fillCreativeFields();
    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));

    expect(
      screen.queryByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).not.toBeInTheDocument();
  });

  it('hard-blocks submit for an EXTERNAL_URL destination with no staged banner', () => {
    render(<CampaignWizard />);
    advanceToReview();

    expect(screen.getByRole('button', { name: 'Enviar para análise' })).toBeDisabled();
  });

  async function fillEventDestination() {
    const response: EventSearchResponse = {
      items: [{ id: 'evt-1', title: 'Big Show', bannerUrl: null, thumbnailUrl: null, startsAt: '2026-01-01', status: 'PUBLISHED' }],
      page: 1,
      pageSize: 20,
      total: 1,
    };
    mockedEventsService.search.mockResolvedValue(response);

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));
    fireEvent.change(screen.getByLabelText('Buscar evento'), { target: { value: 'Big' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Big Show' }));
  }

  it('requires a picked event before advancing the EVENT destination', async () => {
    const response: EventSearchResponse = {
      items: [{ id: 'evt-1', title: 'Big Show', bannerUrl: null, thumbnailUrl: null, startsAt: '2026-01-01', status: 'PUBLISHED' }],
      page: 1,
      pageSize: 20,
      total: 1,
    };
    mockedEventsService.search.mockResolvedValue(response);

    render(<CampaignWizard />);
    fillCreativeFields();

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));
    next();
    expect(screen.getByText('Selecione um evento.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar evento'), { target: { value: 'Big' } });

    await waitFor(() => expect(mockedEventsService.search).toHaveBeenCalledWith('Big'));
    fireEvent.click(await screen.findByRole('button', { name: 'Big Show' }));

    // Picking the event sets the query to its title; the debounced search
    // must not re-fire (and reopen the dropdown) on that same value.
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(mockedEventsService.search).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Big Show' })).not.toBeInTheDocument();

    next();
    expect(screen.getByText('Interesses do público')).toBeInTheDocument();
  });

  async function reachReviewWithEvent(options: { file?: File } = {}) {
    fillCreativeFields();
    if (options.file) fireEvent.change(screen.getByLabelText('Banner'), { target: { files: [options.file] } });
    await fillEventDestination();
    next(); // creative -> targeting
    next(); // targeting -> budget
    fillBudgetStep();
    next(); // budget -> review
  }

  it('submit chain calls create, upload banner, and change status in order', async () => {
    const callOrder: string[] = [];
    mockCreateAdMutateAsync.mockImplementation(async () => {
      callOrder.push('create');
      return { id: 'ad-1' };
    });
    mockUploadBannerMutateAsync.mockImplementation(async () => {
      callOrder.push('upload');
      return 'https://cdn.example.com/banner.png';
    });
    mockChangeStatusMutateAsync.mockImplementation(async () => {
      callOrder.push('status');
    });

    render(<CampaignWizard />);
    const file = new File(['x'], 'banner.png', { type: 'image/png' });
    await reachReviewWithEvent({ file });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));

    await waitFor(() => expect(callOrder).toEqual(['create', 'upload', 'status']));

    expect(mockUploadBannerMutateAsync).toHaveBeenCalledWith({ adId: 'ad-1', file });
    expect(mockChangeStatusMutateAsync).toHaveBeenCalledWith({ adId: 'ad-1', action: 'submit' });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/campaigns/ad-1'));
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it('redirects to the campaign detail with a draft-retry toast when create succeeds but submit fails', async () => {
    mockCreateAdMutateAsync.mockResolvedValue({ id: 'ad-2' });
    mockChangeStatusMutateAsync.mockRejectedValue(new Error('network error'));

    render(<CampaignWizard />);
    await reachReviewWithEvent();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/campaigns/ad-2'));
    expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('rascunho'));
    expect(mockUploadBannerMutateAsync).not.toHaveBeenCalled();
  });

  it('stays on the review with an error banner and a retry button when create fails', async () => {
    mockCreateAdMutateAsync.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'O lance mínimo da pausa Tela cheia é R$ 14,00 por mil exibições.' } },
      message: 'Request failed',
    });

    render(<CampaignWizard />);
    await reachReviewWithEvent();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));

    await waitFor(() => expect(screen.getByText('Não foi possível enviar a campanha.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(toastErrorMock).toHaveBeenCalledWith('O lance mínimo da pausa Tela cheia é R$ 14,00 por mil exibições.');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('submit uploads via the video endpoint for a video campaign, not the banner endpoint', async () => {
    render(<CampaignWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Vídeo antes da transmissão/ }));
    const file = new File(['x'], 'ad.mp4', { type: 'video/mp4' });
    await reachReviewWithEvent({ file });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));

    await waitFor(() => expect(mockUploadVideoMutateAsync).toHaveBeenCalledWith({ adId: 'ad-1', file }));
    expect(mockUploadBannerMutateAsync).not.toHaveBeenCalled();
    expect(mockCreateAdMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'VIDEO_16_9', placements: ['PRE_ROLL'] }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/campaigns/ad-1'));
  });

  it('pause campaign sends the chosen variant', async () => {
    render(<CampaignWizard />);
    fireEvent.click(screen.getByRole('button', { name: /Anúncio na pausa/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tela cheia/ }));
    fillCreativeFields();
    await fillEventDestination();
    next();
    next();
    fillBudgetStep({ bid: '14' });
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));

    await waitFor(() =>
      expect(mockCreateAdMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'WIDE_16_9', placements: ['PLAYER_PAUSE'], pauseVariant: 'FULLSCREEN', bidCents: 1400 }),
      ),
    );
  });

  describe('draft per step', () => {
    it('saves the draft when a step is completed and restores it, at that step, on a new visit', () => {
      const first = render(<CampaignWizard />);
      advanceToTargeting();
      first.unmount();

      render(<CampaignWizard />);
      expect(screen.getByText('Interesses do público')).toBeInTheDocument();
    });

    it('restores the typed values on the first step', () => {
      const first = render(<CampaignWizard />);
      fillCreativeFields();
      fireEvent.click(screen.getByRole('button', { name: 'SAIR E MANTER RASCUNHO' }));
      first.unmount();

      render(<CampaignWizard />);
      expect(screen.getByLabelText('Título')).toHaveValue('Summer Promo');
      expect(screen.getByRole('status')).toHaveTextContent('Retomamos seu rascunho');
    });

    it('"Sair e manter rascunho" goes back to the list', () => {
      render(<CampaignWizard />);
      fireEvent.click(screen.getByRole('button', { name: 'SAIR E MANTER RASCUNHO' }));
      expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('discard deletes the saved draft', () => {
      const first = render(<CampaignWizard />);
      advanceToTargeting();
      fireEvent.click(screen.getByRole('button', { name: 'DESCARTAR' }));
      first.unmount();

      render(<CampaignWizard />);
      expect(screen.getByLabelText('Título')).toHaveValue('');
    });

    it('a successful submit clears the saved draft', async () => {
      const first = render(<CampaignWizard />);
      await reachReviewWithEvent();
      fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));
      await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/campaigns/ad-1'));
      first.unmount();

      render(<CampaignWizard />);
      expect(screen.getByLabelText('Título')).toHaveValue('');
    });
  });
});
