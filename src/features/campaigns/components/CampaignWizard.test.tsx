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

describe('CampaignWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAdMutateAsync.mockResolvedValue({ id: 'ad-1' });
    mockUploadBannerMutateAsync.mockResolvedValue('https://cdn.example.com/banner.png');
    mockChangeStatusMutateAsync.mockResolvedValue(undefined);
  });

  it('cannot advance the creative step without a title and format', () => {
    render(<CampaignWizard />);

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('Informe um título para a campanha.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
  });

  it('advances to destination once title and format are filled in', () => {
    render(<CampaignWizard />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Horizontal (728×90)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByRole('group', { name: 'Tipo de destino' })).toBeInTheDocument();
  });

  function fillCreativeStep() {
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Horizontal (728×90)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
  }

  it('rejects http:// for the EXTERNAL_URL destination', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: 'http://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('A URL deve começar com https://.')).toBeInTheDocument();
  });

  function fillExternalUrlDestination(url = 'https://example.com/landing') {
    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: url } });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
  }

  it('accepts a valid https:// URL and advances to the targeting step', () => {
    render(<CampaignWizard />);
    fillCreativeStep();
    fillExternalUrlDestination();

    expect(screen.getByText('Interesses do público')).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
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
    fillCreativeStep();

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
    expect(screen.getByText('Interesses do público')).toBeInTheDocument();
  });

  it('shows the banner-required warning for EXTERNAL_URL without a staged file', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));

    expect(
      screen.getByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).toBeInTheDocument();
  });

  it('does not show the banner-required warning for the EVENT destination', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));

    expect(
      screen.queryByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).not.toBeInTheDocument();
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

  function advanceToBudget() {
    fillCreativeStep();
    fillExternalUrlDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // targeting -> budget
  }

  it('blocks advancing past budget with a non-positive bid', () => {
    render(<CampaignWizard />);
    advanceToBudget();

    fillBudgetStep({ bid: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('O lance deve ser maior que zero.')).toBeInTheDocument();
  });

  it('blocks advancing past budget when the total limit is less than the daily budget', () => {
    render(<CampaignWizard />);
    advanceToBudget();

    fillBudgetStep({ daily: '100', total: '50' });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('O limite total deve ser maior ou igual ao orçamento diário.')).toBeInTheDocument();
  });

  it('advances to the review step with valid budget inputs', () => {
    render(<CampaignWizard />);
    advanceToBudget();

    fillBudgetStep();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByRole('button', { name: 'Enviar para revisão' })).toBeInTheDocument();
  });

  it('shows every entered value on the review step', () => {
    render(<CampaignWizard />);
    advanceToBudget();
    fillBudgetStep({ bid: '10', daily: '50', total: '500' });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

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
    advanceToBudget();
    fillBudgetStep();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

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

    // Stage a banner while still on the creative step (each step only
    // renders its own fields, so this must happen before advancing).
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Horizontal (728×90)' }));
    const file = new File(['x'], 'banner.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Banner'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    await fillEventDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // targeting -> budget
    fillBudgetStep();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // budget -> review

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
    fillCreativeStep();
    await fillEventDestination();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // targeting -> budget
    fillBudgetStep();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' })); // budget -> review

    fireEvent.click(screen.getByRole('button', { name: 'Enviar para revisão' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/campaigns/ad-2'));
    expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('rascunho'));
    expect(mockUploadBannerMutateAsync).not.toHaveBeenCalled();
  });
});
