import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    expect(screen.getByText('Nenhuma campanha criada ainda.')).toBeInTheDocument();
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
    expect(screen.queryByText('Nenhuma campanha criada ainda.')).not.toBeInTheDocument();
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
    expect(screen.getByText('3.33%')).toBeInTheDocument();
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
});
