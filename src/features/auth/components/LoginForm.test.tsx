import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';
import { authService } from '../services/auth.service';
import type { AuthResponse } from '../types/auth.types';

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

const mockedAuthService = vi.mocked(authService, true);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
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
  });

  it('submits credentials, stores the session, and navigates home', async () => {
    mockedAuthService.login.mockResolvedValueOnce(authResponse);

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'super-secret' });
    });

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('access-token');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token');
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'));
  });

  it('validates fields before submitting', () => {
    renderWithProviders(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
    expect(mockedAuthService.login).not.toHaveBeenCalled();
  });
});
