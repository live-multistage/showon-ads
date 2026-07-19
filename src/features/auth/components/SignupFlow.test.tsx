import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignupFlow } from './SignupFlow';
import { authService } from '../services/auth.service';
import { advertisersService } from '@/features/advertisements/services/advertisers.service';
import type { AuthResponse } from '../types/auth.types';
import type { AdvertiserAccountResponse } from '@/features/advertisements/types/advertisement.types';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('@/features/advertisements/services/advertisers.service', () => ({
  advertisersService: {
    create: vi.fn(),
    me: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService, true);
const mockedAdvertisersService = vi.mocked(advertisersService, true);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const authResponse: AuthResponse = {
  user: { id: 'u1', email: 'new@example.com', displayName: 'New User', role: 'USER', createdAt: '', updatedAt: '' },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  refreshExpiresAt: '2026-01-01T00:00:00.000Z',
};

const advertiserAccount = {} as AdvertiserAccountResponse;

describe('SignupFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('chains user-create then advertiser-create, in order', async () => {
    mockedAuthService.register.mockResolvedValueOnce(authResponse);
    mockedAdvertisersService.create.mockResolvedValueOnce(advertiserAccount);

    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(mockedAuthService.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        displayName: 'New User',
        password: 'super-secret',
      });
    });

    // Step 2 — the company form — only appears after registration resolves.
    expect(await screen.findByLabelText('Company name')).toBeInTheDocument();
    expect(mockedAdvertisersService.create).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Company name'), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockedAdvertisersService.create).toHaveBeenCalledWith({ name: 'Acme Corp' });
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));

    // Call order matters: user-create must happen before advertiser-create.
    const registerOrder = mockedAuthService.register.mock.invocationCallOrder[0];
    const createOrder = mockedAdvertisersService.create.mock.invocationCallOrder[0];
    expect(registerOrder).toBeLessThan(createOrder);
  });
});
