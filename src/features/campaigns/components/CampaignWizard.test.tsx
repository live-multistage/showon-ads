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
const mockChangeStatusMutateAsync = vi.fn();

vi.mock('@/features/advertisements/mutations/use-create-ad.mutation', () => ({
  useCreateAdMutation: () => ({ mutateAsync: mockCreateAdMutateAsync, isPending: false }),
}));
vi.mock('@/features/advertisements/mutations/use-upload-banner.mutation', () => ({
  useUploadBannerMutation: () => ({ mutateAsync: mockUploadBannerMutateAsync, isPending: false }),
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

// Wizard order: budget -> targeting -> creative (creative + destination merged) -> review.
describe('CampaignWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAdMutateAsync.mockResolvedValue({ id: 'ad-1' });
    mockUploadBannerMutateAsync.mockResolvedValue('https://cdn.example.com/banner.png');
    mockChangeStatusMutateAsync.mockResolvedValue(undefined);
  });

  function fillBudgetStep({
    bid = '10',
    daily = '50',
    total = '500',
    starts = '2026-08-01T10:00',
    ends = '2026-09-01T10:00',
  } = {}) {
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /CPM/ }));
    fireEvent.change(screen.getByLabelText(/^Lance por/), { target: { value: bid } });
    fireEvent.change(screen.getByLabelText('Orçamento diário (R$)'), { target: { value: daily } });
    fireEvent.change(screen.getByLabelText('Limite total de gasto (R$)'), { target: { value: total } });
    fireEvent.change(screen.getByLabelText('Início da veiculação'), { target: { value: starts } });
    fireEvent.change(screen.getByLabelText('Fim da veiculação'), { target: { value: ends } });
  }

  it('cannot advance the budget step with a non-positive bid', () => {
    render(<CampaignWizard />);
    fillBudgetStep({ bid: '0' });

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('O lance deve ser maior que zero.')).toBeInTheDocument();
  });

  it('advances to targeting once budget inputs are valid', () => {
    render(<CampaignWizard />);
    fillBudgetStep();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('Interesses do público')).toBeInTheDocument();
  });

  function advanceToTargeting() {
    fillBudgetStep();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // budget -> targeting
  }

  it('blocks advancing past targeting when every placement is unchecked', () => {
    render(<CampaignWizard />);
    advanceToTargeting();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Feed' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Página do evento' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Checkout' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pós-compra' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pausa do player' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('Selecione pelo menos um posicionamento.')).toBeInTheDocument();
  });

  function advanceToCreative() {
    advanceToTargeting();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // targeting -> creative
  }

  it('advances to the merged creative+destination step from targeting', () => {
    render(<CampaignWizard />);
    advanceToCreative();

    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tipo de destino' })).toBeInTheDocument();
  });

  it('cannot advance the merged step without a title and format', () => {
    render(<CampaignWizard />);
    advanceToCreative();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('Informe um título para a campanha.')).toBeInTheDocument();
  });

  function fillCreativeFields() {
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Horizontal (728×90)' }));
  }

  it('rejects http:// for the EXTERNAL_URL destination', () => {
    render(<CampaignWizard />);
    advanceToCreative();
    fillCreativeFields();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: 'http://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('A URL deve começar com https://.')).toBeInTheDocument();
  });

  function fillExternalUrlDestination(url = 'https://example.com/landing') {
    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: url } });
  }

  it('accepts a valid https:// URL and advances to the review step', () => {
    render(<CampaignWizard />);
    advanceToCreative();
    fillCreativeFields();
    fillExternalUrlDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeInTheDocument();
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
    advanceToCreative();
    fillCreativeFields();

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Selecione um evento.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar evento'), { target: { value: 'Big' } });

    await waitFor(() => expect(mockedEventsService.search).toHaveBeenCalledWith('Big'));
    fireEvent.click(await screen.findByRole('button', { name: 'Big Show' }));

    // Picking the event sets the query to its title; the debounced search
    // must not re-fire (and reopen the dropdown) on that same value.
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(mockedEventsService.search).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Big Show' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeInTheDocument();
  });

  it('shows the banner-required warning for EXTERNAL_URL without a staged file', () => {
    render(<CampaignWizard />);
    advanceToCreative();
    fillCreativeFields();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));

    expect(
      screen.getByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).toBeInTheDocument();
  });

  it('does not show the banner-required warning for the EVENT destination', () => {
    render(<CampaignWizard />);
    advanceToCreative();
    fillCreativeFields();

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));

    expect(
      screen.queryByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).not.toBeInTheDocument();
  });

  function advanceToReview() {
    advanceToCreative();
    fillCreativeFields();
    fillExternalUrlDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // creative -> review
  }

  it('shows every entered value on the review step', () => {
    render(<CampaignWizard />);
    advanceToReview();

    expect(screen.getByText('Summer Promo')).toBeInTheDocument();
    expect(screen.getByText('Horizontal (728×90)')).toBeInTheDocument();
    expect(screen.getByText('https://example.com/landing')).toBeInTheDocument();
    expect(screen.getByText('CPM')).toBeInTheDocument();
    expect(screen.getByText(/10,00 \/ 1k impressões/)).toBeInTheDocument();
    expect(screen.getByText(/50,00/)).toBeInTheDocument();
    expect(screen.getByText(/500,00/)).toBeInTheDocument();
  });

  it('hard-blocks submit for an EXTERNAL_URL destination with no staged banner', () => {
    render(<CampaignWizard />);
    advanceToReview();

    expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeDisabled();
  });

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
    advanceToCreative();
    fillCreativeFields();

    // Stage a banner while still on the merged creative+destination step.
    const file = new File(['x'], 'banner.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Banner'), { target: { files: [file] } });

    await fillEventDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // creative -> review

    fireEvent.click(screen.getByRole('button', { name: 'Enviar para revisão' }));

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
    advanceToCreative();
    fillCreativeFields();
    await fillEventDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // creative -> review

    fireEvent.click(screen.getByRole('button', { name: 'Enviar para revisão' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/campaigns/ad-2'));
    expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('rascunho'));
    expect(mockUploadBannerMutateAsync).not.toHaveBeenCalled();
  });
});
