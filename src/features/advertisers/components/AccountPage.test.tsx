import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountPage } from './AccountPage';
import { useAdvertiserMembersQuery } from '@/features/advertisements/queries/use-advertiser-members';
import { useRenameAdvertiserMutation } from '@/features/advertisements/mutations/use-rename-advertiser.mutation';
import { useSession } from '@/features/auth/hooks/use-session';
import type {
  AdvertiserAccountResponse,
  AdvertiserMemberResponse,
} from '@/features/advertisements/types/advertisement.types';

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

vi.mock('@/features/advertisements/queries/use-advertiser-members', () => ({
  useAdvertiserMembersQuery: vi.fn(),
}));
vi.mock('@/features/advertisements/mutations/use-rename-advertiser.mutation', () => ({
  useRenameAdvertiserMutation: vi.fn(),
}));
vi.mock('@/features/auth/hooks/use-session', () => ({
  useSession: vi.fn(),
}));

const mockedUseAdvertiserMembersQuery = vi.mocked(useAdvertiserMembersQuery);
const mockedUseRenameAdvertiserMutation = vi.mocked(useRenameAdvertiserMutation);
const mockedUseSession = vi.mocked(useSession);

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

const mockRenameMutate = vi.fn();

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AccountPage />
    </QueryClientProvider>,
  );
}

const account = {
  id: 'acc-a',
  name: 'Acme Ads',
  organizationId: null,
  status: 'ACTIVE',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as AdvertiserAccountResponse;

function makeMember(overrides: Partial<AdvertiserMemberResponse>): AdvertiserMemberResponse {
  return {
    userId: 'user-1',
    displayName: 'Alice',
    email: 'alice@example.com',
    role: 'OWNER',
    ...overrides,
  };
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccounts = [account];
    mockActiveAccountId = 'acc-a';
    mockIsAccountsLoading = false;

    mockedUseAdvertiserMembersQuery.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvertiserMembersQuery>);

    mockedUseRenameAdvertiserMutation.mockReturnValue({
      mutate: mockRenameMutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useRenameAdvertiserMutation>);

    mockedUseSession.mockReturnValue({
      user: { id: 'user-1', email: 'alice@example.com', displayName: 'Alice', role: 'ADVERTISER' },
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it('renders the account name and ACTIVE status', () => {
    renderPage();

    expect(screen.getByText('Acme Ads')).toBeInTheDocument();
    expect(screen.getByText('CONTA ATIVA')).toBeInTheDocument();
  });

  it('shows a linked-organization badge when organizationId is set', () => {
    mockAccounts = [{ ...account, organizationId: 'org-1' }];

    renderPage();

    expect(screen.getByText('VINCULADA')).toBeInTheDocument();
  });

  it('does not show the organization badge when organizationId is null', () => {
    renderPage();

    expect(screen.queryByText('VINCULADA')).not.toBeInTheDocument();
  });

  it('renders the members list with names, emails, and roles', () => {
    mockedUseAdvertiserMembersQuery.mockReturnValue({
      data: [
        makeMember({ userId: 'user-1', displayName: 'Alice', role: 'OWNER' }),
        makeMember({ userId: 'user-2', displayName: 'Bob', email: 'bob@example.com', role: 'MANAGER' }),
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvertiserMembersQuery>);

    renderPage();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('PROPRIETÁRIO')).toBeInTheDocument();
    expect(screen.getByText('GERENTE')).toBeInTheDocument();
  });

  it('shows the "Editar nome" control only when the caller is OWNER', () => {
    mockedUseAdvertiserMembersQuery.mockReturnValue({
      data: [makeMember({ userId: 'user-1', role: 'OWNER' })],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvertiserMembersQuery>);

    renderPage();

    expect(screen.getByRole('button', { name: 'EDITAR NOME' })).toBeInTheDocument();
  });

  it('hides the "Editar nome" control for a MANAGER caller', () => {
    mockedUseAdvertiserMembersQuery.mockReturnValue({
      data: [makeMember({ userId: 'user-1', role: 'MANAGER' })],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvertiserMembersQuery>);

    renderPage();

    expect(screen.queryByRole('button', { name: 'EDITAR NOME' })).not.toBeInTheDocument();
  });

  it('submits the renamed value through the rename mutation', () => {
    mockedUseAdvertiserMembersQuery.mockReturnValue({
      data: [makeMember({ userId: 'user-1', role: 'OWNER' })],
      isLoading: false,
    } as unknown as ReturnType<typeof useAdvertiserMembersQuery>);

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'EDITAR NOME' }));
    fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(mockRenameMutate).toHaveBeenCalledWith(
      { name: 'New Name' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('renders loading skeletons while accounts are resolving', () => {
    mockIsAccountsLoading = true;

    renderPage();

    expect(screen.getByLabelText('Carregando conta')).toBeInTheDocument();
  });

  it('renders an empty state when there is no active account', () => {
    mockAccounts = [];
    mockActiveAccountId = null;

    renderPage();

    expect(screen.getByText('Nenhuma conta de anunciante encontrada.')).toBeInTheDocument();
  });
});
