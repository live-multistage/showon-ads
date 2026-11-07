import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';
import { authService } from '../services/auth.service';
import type { AuthResponse } from '../types/auth.types';

const assignMock = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService, true);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@example.com' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'super-secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

const authResponse: AuthResponse = {
  user: { id: 'u1', email: 'user@example.com', displayName: 'User', role: 'USER', createdAt: '', updatedAt: '' },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  refreshExpiresAt: '2026-01-01T00:00:00.000Z',
};

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    searchParams = new URLSearchParams();
    // jsdom's window.location.assign is a no-op that warns; stub it so the
    // component's post-login navigation is observable and side-effect free.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: assignMock },
    });
  });

  it('renders the PT-BR labels, title and submit button', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('links to the main site password recovery in a new tab', () => {
    renderWithProviders(<LoginForm />);

    const link = screen.getByRole('link', { name: /esqueci a senha/i });
    expect(link).toHaveAttribute('href', 'https://showon.io/forgot-password');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('submits credentials, stores the session, and navigates home', async () => {
    mockedAuthService.login.mockResolvedValueOnce(authResponse);

    renderWithProviders(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'super-secret' });
    });

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
    });

    // A full-document load (not router.push) so the persistent AuthGuard
    // remounts and picks up the freshly-stored session instead of bouncing
    // back to /login on its stale unauthenticated state.
    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/'));
  });

  it('validates fields before submitting', () => {
    renderWithProviders(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe um e-mail válido.');
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });

  it('navigates to the redirect target when ?redirect= is a safe internal path', async () => {
    searchParams = new URLSearchParams({ redirect: '/invite/abc' });
    mockedAuthService.login.mockResolvedValueOnce(authResponse);

    renderWithProviders(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/invite/abc'));
  });

  it('shows a PT-BR message when the credentials are wrong', async () => {
    mockedAuthService.login.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });

    renderWithProviders(<LoginForm />);
    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });

  it('shows a generic PT-BR message on network failure', async () => {
    mockedAuthService.login.mockRejectedValueOnce({ isAxiosError: true, message: 'Network Error' });

    renderWithProviders(<LoginForm />);
    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível entrar agora. Tente de novo.');
  });

  it('shows a clear message when the account email is not verified', async () => {
    mockedAuthService.login.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 403, data: { code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' } },
    });

    renderWithProviders(<LoginForm />);
    fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Confirme seu e-mail antes de entrar.');
  });

  it('falls back to / when ?redirect= is an open-redirect vector', async () => {
    searchParams = new URLSearchParams({ redirect: '//evil.com' });
    mockedAuthService.login.mockResolvedValueOnce(authResponse);

    renderWithProviders(<LoginForm />);
    fillAndSubmit();

    await waitFor(() => expect(assignMock).toHaveBeenCalledWith('/'));
  });
});
