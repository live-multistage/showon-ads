import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGuard } from './AuthGuard';
import { advertisersService } from '@/features/advertisements/services/advertisers.service';
import type { AdvertiserAccountResponse } from '@/features/advertisements/types/advertisement.types';

const replaceMock = vi.fn();
let currentPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}));

vi.mock('@/features/advertisements/services/advertisers.service', () => ({
  advertisersService: {
    me: vi.fn(),
    create: vi.fn(),
  },
}));

const mockedAdvertisersService = vi.mocked(advertisersService, true);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentPathname = '/';
  });

  it('redirects to /login when there is no stored session', async () => {
    renderWithProviders(
      <AuthGuard>
        <p>protected content</p>
      </AuthGuard>,
    );

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children without redirecting on public paths even with no session', async () => {
    currentPathname = '/login';

    renderWithProviders(
      <AuthGuard>
        <p>login page</p>
      </AuthGuard>,
    );

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('shows the advertiser creation step when the session has zero accounts', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ id: 'u1', email: 'a@b.com', displayName: 'A', role: 'USER' }),
    );
    mockedAdvertisersService.me.mockResolvedValueOnce([]);

    renderWithProviders(
      <AuthGuard>
        <p>protected content</p>
      </AuthGuard>,
    );

    expect(await screen.findByText('Create your advertiser account')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('renders children once the session has at least one advertiser account', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ id: 'u1', email: 'a@b.com', displayName: 'A', role: 'USER' }),
    );
    mockedAdvertisersService.me.mockResolvedValueOnce([{} as AdvertiserAccountResponse]);

    renderWithProviders(
      <AuthGuard>
        <p>protected content</p>
      </AuthGuard>,
    );

    expect(await screen.findByText('protected content')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
