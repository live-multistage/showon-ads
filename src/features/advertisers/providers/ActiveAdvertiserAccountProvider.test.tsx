import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveAdvertiserAccountProvider, useActiveAdvertiserAccount } from './ActiveAdvertiserAccountProvider';
import { advertisersService } from '@/features/advertisements/services/advertisers.service';
import type { AdvertiserAccountResponse } from '@/features/advertisements/types/advertisement.types';

vi.mock('@/features/advertisements/services/advertisers.service', () => ({
  advertisersService: {
    me: vi.fn(),
    create: vi.fn(),
  },
}));

const mockedAdvertisersService = vi.mocked(advertisersService, true);

const accountA = { id: 'acc-a', name: 'Account A' } as AdvertiserAccountResponse;
const accountB = { id: 'acc-b', name: 'Account B' } as AdvertiserAccountResponse;

function Consumer() {
  const { accounts, activeAccountId, setActiveAccountId } = useActiveAdvertiserAccount();
  return (
    <div>
      <span data-testid="active">{activeAccountId ?? 'none'}</span>
      {accounts.map((account) => (
        <button key={account.id} onClick={() => setActiveAccountId(account.id)}>
          {account.name}
        </button>
      ))}
    </div>
  );
}

function renderWithProviders() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveAdvertiserAccountProvider>
        <Consumer />
      </ActiveAdvertiserAccountProvider>
    </QueryClientProvider>,
  );
}

describe('ActiveAdvertiserAccountProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults the active account to the first one returned', async () => {
    mockedAdvertisersService.me.mockResolvedValueOnce([accountA, accountB]);

    renderWithProviders();

    await waitFor(() => expect(screen.getByTestId('active')).toHaveTextContent('acc-a'));
  });

  it('switches the active account id when setActiveAccountId is called', async () => {
    mockedAdvertisersService.me.mockResolvedValueOnce([accountA, accountB]);

    renderWithProviders();

    await screen.findByText('Account B');
    fireEvent.click(screen.getByText('Account B'));

    expect(screen.getByTestId('active')).toHaveTextContent('acc-b');
  });
});
