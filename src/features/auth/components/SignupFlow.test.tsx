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

    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('prefills the email field from ?email= (invite round-trip)', () => {
    searchParams = new URLSearchParams({ email: 'invitee@example.com' });

    renderWithProviders(<SignupFlow />);

    expect(screen.getByLabelText('Email')).toHaveValue('invitee@example.com');
  });

  it('lets the user resend the verification email from the check-email state', async () => {
    mockedAuthService.register.mockResolvedValueOnce({ verificationRequired: true });
    mockedAuthService.resendVerification.mockResolvedValueOnce(undefined);

    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByText('Check your email');
    fireEvent.click(screen.getByRole('button', { name: /resend email/i }));

    await waitFor(() => {
      expect(mockedAuthService.resendVerification).toHaveBeenCalledWith('new@example.com');
    });
  });

  it('shows an error when resend fails', async () => {
    mockedAuthService.register.mockResolvedValueOnce({ verificationRequired: true });
    mockedAuthService.resendVerification.mockRejectedValueOnce(new Error('network'));

    renderWithProviders(<SignupFlow />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByText('Check your email');
    fireEvent.click(screen.getByRole('button', { name: /resend email/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not resend/i);
  });
});
