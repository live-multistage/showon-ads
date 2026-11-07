import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CampaignListPage } from './CampaignListPage';
import { useListAdsQuery } from '@/features/advertisements/queries/use-list-ads';
import type { AdResponse, AdvertiserAccountResponse } from '@/features/advertisements/types/advertisement.types';

// jsdom doesn't implement pointer capture / scrollIntoView, which Radix
// Select's open/select interactions rely on.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/features/advertisements/queries/use-list-ads', () => ({
  useListAdsQuery: vi.fn(),
}));

const mockedUseListAdsQuery = vi.mocked(useListAdsQuery);

let mockWallet: { data?: { balanceCents: number; lowBalance: boolean } } = { data: { balanceCents: 18240, lowBalance: false } };
vi.mock('@/features/settings/queries/use-wallet', () => ({
  useWalletQuery: () => mockWallet,
}));

// The account context is mocked as a plain object read fresh on every render
// (mutated by the mocked setActiveAccountId + an explicit RTL rerender) —
// avoids fighting Radix Select's real portal/pointer-capture plumbing while
// still exercising CampaignListPage's own filtering logic end to end.
let mockAccounts: AdvertiserAccountResponse[] = [];
let mockActiveAccountId: string | null = null;
let mockIsAccountsLoading = false;
const mockSetActiveAccountId = vi.fn((id: string) => {
  mockActiveAccountId = id;
});

vi.mock('@/features/advertisers/providers/ActiveAdvertiserAccountProvider', () => ({
  useActiveAdvertiserAccount: () => ({
    accounts: mockAccounts,
    activeAccountId: mockActiveAccountId,
    setActiveAccountId: mockSetActiveAccountId,
    isLoading: mockIsAccountsLoading,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignListPage />
    </QueryClientProvider>,
  );
}

const accountA = { id: 'acc-a', name: 'Account A' } as AdvertiserAccountResponse;
const accountB = { id: 'acc-b', name: 'Account B' } as AdvertiserAccountResponse;

function makeAd(overrides: Partial<AdResponse>): AdResponse {
  return {
    id: 'ad-1',
    advertiserAccountId: 'acc-a',
    destination: null,
    title: 'Campaign',
    format: 'HORIZONTAL_728x90',
    status: 'ACTIVE',
    placements: [],
    targetDomains: [],
    targetCategories: [],
    targetAgeBrackets: [],
    bannerUrl: null,
    videoUrl: null,
    videoDurationSec: null,
    frequencyCapMax: null,
    frequencyCapWindow: null,
    billingModel: 'CPM',
    bidCents: 100,
    dailyBudgetCents: 1000,
    totalLimitCents: 100000,
    totalSpendCents: 25000,
    metrics: { impressions: 0, clicks: 0, ctr: null, spendCents: 0 },
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-02-01T00:00:00.000Z',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CampaignListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccounts = [accountA];
    mockActiveAccountId = 'acc-a';
    mockIsAccountsLoading = false;
    mockWallet = { data: { balanceCents: 18240, lowBalance: false } };
  });

  it('renders campaigns from the mocked ads query', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: [makeAd({ id: 'ad-1', title: 'Summer Promo' })],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('Summer Promo')).toBeInTheDocument();
  });

  it('shows the empty state with a create CTA when there are no campaigns', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('Sua primeira campanha em três passos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova campanha' })).toHaveAttribute(
      'href',
      '/campaigns/new',
    );
  });

  it('maps each ad status to the correct badge label', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: [
        makeAd({ id: 'ad-active', title: 'Active ad', status: 'ACTIVE' }),
        makeAd({ id: 'ad-paused', title: 'Paused ad', status: 'PAUSED' }),
        makeAd({ id: 'ad-review', title: 'Review ad', status: 'REVIEW' }),
        makeAd({ id: 'ad-ended', title: 'Ended ad', status: 'ENDED' }),
        makeAd({ id: 'ad-draft', title: 'Draft ad', status: 'DRAFT' }),
        makeAd({ id: 'ad-rejected', title: 'Rejected ad', status: 'REJECTED' }),
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Pausado')).toBeInTheDocument();
    // 'span' scopes to the status Badge — the REVIEW status label and the
    // "Em análise" status-tab button text are otherwise textually identical.
    expect(screen.getByText('Em análise', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();

    // 6 ads > PAGE_SIZE (5) — the 6th (Rejeitado) lands on page 2.
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });

  it('shows a subtle hint for ads with no destination and a type label otherwise', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: [
        makeAd({ id: 'ad-legacy', title: 'Legacy ad', destination: null }),
        makeAd({ id: 'ad-event', title: 'Event ad', destination: { type: 'EVENT', eventId: 'e1' } }),
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('Sem destino')).toBeInTheDocument();
    expect(screen.getByText('Evento')).toBeInTheDocument();
  });

  it('renders loading skeletons while ads are loading', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByLabelText('Carregando campanhas')).toBeInTheDocument();
  });

  it('shows skeletons instead of the empty state while activeAccountId is still resolving', () => {
    mockAccounts = [accountA];
    mockActiveAccountId = null;

    mockedUseListAdsQuery.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByLabelText('Carregando campanhas')).toBeInTheDocument();
    expect(screen.queryByText('Sua primeira campanha em três passos')).not.toBeInTheDocument();
  });

  it('wires the account switcher to setActiveAccountId and re-filters the list on change', () => {
    mockAccounts = [accountA, accountB];
    mockActiveAccountId = 'acc-a';

    mockedUseListAdsQuery.mockReturnValue({
      data: [
        makeAd({ id: 'ad-a', title: 'Account A campaign', advertiserAccountId: 'acc-a' }),
        makeAd({ id: 'ad-b', title: 'Account B campaign', advertiserAccountId: 'acc-b' }),
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    const { rerender } = renderPage();

    expect(screen.getByText('Account A campaign')).toBeInTheDocument();
    expect(screen.queryByText('Account B campaign')).not.toBeInTheDocument();

    // Drive the real SimpleCustomSelect UI (Radix) rather than calling the
    // mocked setter directly, to prove CampaignListPage actually wires it up.
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Account B' }));

    expect(mockSetActiveAccountId).toHaveBeenCalledWith('acc-b');

    // setActiveAccountId is mocked (no real state), so force a re-render to
    // observe the list filter reacting to the mutated module-level value.
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CampaignListPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Account B campaign')).toBeInTheDocument();
    expect(screen.queryByText('Account A campaign')).not.toBeInTheDocument();
  });

  it('sums impressions and clicks into the KPI strip and computes average CTR', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: [
        makeAd({ id: 'ad-1', metrics: { impressions: 1000, clicks: 40, ctr: 4, spendCents: 2000 } }),
        makeAd({ id: 'ad-2', metrics: { impressions: 500, clicks: 10, ctr: 2, spendCents: 1000 } }),
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('1.500')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText(/CTR médio 3,33%/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?30,00/)).toBeInTheDocument();
  });

  it('filters rows by status tab and shows per-tab counts', () => {
    mockedUseListAdsQuery.mockReturnValue({
      data: [
        makeAd({ id: 'ad-active', title: 'Active campaign', status: 'ACTIVE' }),
        makeAd({ id: 'ad-paused', title: 'Paused campaign', status: 'PAUSED' }),
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('Active campaign')).toBeInTheDocument();
    expect(screen.getByText('Paused campaign')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ativas/ }));

    expect(screen.getByText('Active campaign')).toBeInTheDocument();
    expect(screen.queryByText('Paused campaign')).not.toBeInTheDocument();
  });

  it('paginates rows 5 per page', () => {
    const ads = Array.from({ length: 7 }, (_, i) => makeAd({ id: `ad-${i}`, title: `Campaign ${i}` }));
    mockedUseListAdsQuery.mockReturnValue({
      data: ads,
      isLoading: false,
    } as unknown as ReturnType<typeof useListAdsQuery>);

    renderPage();

    expect(screen.getByText('Campaign 0')).toBeInTheDocument();
    expect(screen.queryByText('Campaign 6')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(screen.getByText('Campaign 6')).toBeInTheDocument();
    expect(screen.queryByText('Campaign 0')).not.toBeInTheDocument();
  });

  describe('wallet and delivery', () => {
    const list = (data: AdResponse[]) =>
      mockedUseListAdsQuery.mockReturnValue({ data, isLoading: false, isError: false, refetch: vi.fn() } as unknown as ReturnType<typeof useListAdsQuery>);
    const live = (o: Partial<AdResponse>) =>
      makeAd({ startsAt: '2026-01-01T00:00:00Z', endsAt: '2099-01-01T00:00:00Z', ...o });

    it('shows the wallet balance strip with a link to add credits', () => {
      list([live({ title: 'A' })]);
      renderPage();
      const strip = screen.getByText('SALDO DA CARTEIRA').parentElement!.parentElement!;
      expect(strip).toHaveTextContent(/R\$\s?182,40/);
      expect(within(strip).getByRole('link', { name: 'Adicionar créditos' })).toHaveAttribute('href', '/billing');
    });

    it('shows the no-funds banner and marks active campaigns as stopped', () => {
      mockWallet = { data: { balanceCents: 0, lowBalance: true } };
      list([live({ title: 'A' }), live({ id: 'b', title: 'B' })]);
      renderPage();
      expect(screen.getByRole('status')).toHaveTextContent(/seu saldo acabou/i);
      expect(screen.getByRole('status')).toHaveTextContent(/2 campanhas ativas pararam/);
      expect(screen.getAllByText('Parada: sem saldo')).toHaveLength(2);
    });

    it('shows the low-balance banner', () => {
      mockWallet = { data: { balanceCents: 1500, lowBalance: true } };
      list([live({ title: 'A' })]);
      renderPage();
      expect(screen.getByRole('status')).toHaveTextContent(/saldo baixo/i);
    });

    it('shows delivering for an active funded campaign', () => {
      list([live({ title: 'A' })]);
      renderPage();
      expect(screen.getByText('Entregando')).toBeInTheDocument();
    });

    it('counts rejected campaigns and video drafts in "Precisam de ação"', () => {
      list([
        live({ id: 'r', status: 'REJECTED', title: 'R' }),
        live({ id: 'v', status: 'DRAFT', format: 'VIDEO_16_9', title: 'V' }),
        live({ id: 'ok', title: 'OK' }),
      ]);
      renderPage();
      expect(screen.getByText('PRECISAM DE AÇÃO').parentElement).toHaveTextContent('2');
      expect(screen.getByText('1 rejeitada · 1 sem vídeo')).toBeInTheDocument();
    });

    it('rejected campaigns live under "Precisam de ajuste", not Rascunhos', () => {
      list([live({ id: 'r', status: 'REJECTED', title: 'Rejected one' }), live({ id: 'd', status: 'DRAFT', title: 'Draft one' })]);
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: /Precisam de ajuste/ }));
      expect(screen.getByText('Rejected one')).toBeInTheDocument();
      expect(screen.queryByText('Draft one')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Rascunhos/ }));
      expect(screen.getByText('Draft one')).toBeInTheDocument();
      expect(screen.queryByText('Rejected one')).not.toBeInTheDocument();
    });

    it('filters by campaign type', () => {
      list([
        live({ id: 'b', title: 'Banner one' }),
        live({ id: 'p', title: 'Pre one', format: 'VIDEO_16_9' }),
        live({ id: 'z', title: 'Pause one', format: 'WIDE_16_9' }),
      ]);
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Vídeo antes' }));
      expect(screen.getByText('Pre one')).toBeInTheDocument();
      expect(screen.queryByText('Banner one')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Pausa' }));
      expect(screen.getByText('Pause one')).toBeInTheDocument();
      expect(screen.queryByText('Pre one')).not.toBeInTheDocument();
    });

    it('shows an error with retry — not the empty state — when the list fails to load', () => {
      const refetch = vi.fn();
      mockedUseListAdsQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch } as unknown as ReturnType<typeof useListAdsQuery>);
      renderPage();
      expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar suas campanhas/i);
      expect(screen.queryByText('Sua primeira campanha em três passos')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
      expect(refetch).toHaveBeenCalled();
    });

    it('empty state step 1 is done when the wallet is funded', () => {
      list([]);
      renderPage();
      expect(screen.getByText('✓ FEITO')).toBeInTheDocument();
    });
  });
});
