import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignupFlow } from './SignupFlow';
import { authService } from '../services/auth.service';

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
    resendVerification: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService, true);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('SignupFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    searchParams = new URLSearchParams();
  });

  it('registers the account and shows the check-email state (no auto-login)', async () => {
    mockedAuthService.register.mockResolvedValueOnce({ verificationRequired: true });

    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => {
      expect(mockedAuthService.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        displayName: 'New User',
        password: 'super-secret',
      });
    });

    expect(await screen.findByText('Confira seu e-mail')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('prefills the email field from ?email= (invite round-trip)', () => {
    searchParams = new URLSearchParams({ email: 'invitee@example.com' });

    renderWithProviders(<SignupFlow />);

    expect(screen.getByLabelText('E-mail')).toHaveValue('invitee@example.com');
  });

  it('lets the user resend the verification email from the check-email state', async () => {
    mockedAuthService.register.mockResolvedValueOnce({ verificationRequired: true });
    mockedAuthService.resendVerification.mockResolvedValueOnce(undefined);

    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await screen.findByText('Confira seu e-mail');
    fireEvent.click(screen.getByRole('button', { name: /reenviar e-mail/i }));

    await waitFor(() => {
      expect(mockedAuthService.resendVerification).toHaveBeenCalledWith('new@example.com');
    });
  });

  it('shows an error when resend fails', async () => {
    mockedAuthService.register.mockResolvedValueOnce({ verificationRequired: true });
    mockedAuthService.resendVerification.mockRejectedValueOnce(new Error('network'));

    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    await screen.findByText('Confira seu e-mail');
    fireEvent.click(screen.getByRole('button', { name: /reenviar e-mail/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível reenviar/i);
  });

  it('flags the invalid field instead of registering', () => {
    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe um e-mail válido.');
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Nome')).not.toHaveAttribute('aria-invalid');
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    renderWithProviders(<SignupFlow />);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
  });
});
