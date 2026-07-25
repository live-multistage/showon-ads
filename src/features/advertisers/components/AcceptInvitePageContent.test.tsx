import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AcceptInvitePageContent } from './AcceptInvitePageContent';
import { useInvitePreviewQuery } from '@/features/advertisements/queries/use-invite-preview';
import { useAcceptInviteMutation } from '@/features/advertisements/mutations/use-accept-invite.mutation';
import { useSession } from '@/features/auth/hooks/use-session';
import type { AdvertiserInvitePreview } from '@/features/advertisements/types/advertisement.types';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/features/advertisements/queries/use-invite-preview', () => ({
  useInvitePreviewQuery: vi.fn(),
}));
vi.mock('@/features/advertisements/mutations/use-accept-invite.mutation', () => ({
  useAcceptInviteMutation: vi.fn(),
}));
vi.mock('@/features/auth/hooks/use-session', () => ({
  useSession: vi.fn(),
}));

const mockedUseInvitePreviewQuery = vi.mocked(useInvitePreviewQuery);
const mockedUseAcceptInviteMutation = vi.mocked(useAcceptInviteMutation);
const mockedUseSession = vi.mocked(useSession);

const mockAcceptMutate = vi.fn();

const preview: AdvertiserInvitePreview = {
  accountId: 'acc-1',
  accountName: 'Acme Ads',
  role: 'MANAGER',
  inviterName: 'Alice',
  email: 'invited@example.com',
  status: 'PENDING',
  expiresAt: '2026-08-01T00:00:00.000Z',
};

function mockPreview(overrides: Partial<AdvertiserInvitePreview> = {}, error: unknown = null) {
  mockedUseInvitePreviewQuery.mockReturnValue({
    data: error ? undefined : { ...preview, ...overrides },
    isLoading: false,
    error,
  } as unknown as ReturnType<typeof useInvitePreviewQuery>);
}

function mockSession(overrides: { user?: { id: string; email: string; displayName: string; role: string } | null; isAuthenticated?: boolean } = {}) {
  mockedUseSession.mockReturnValue({
    user: overrides.user ?? null,
    isAuthenticated: overrides.isAuthenticated ?? false,
    isLoading: false,
    logout: vi.fn(),
  });
}

describe('AcceptInvitePageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAcceptInviteMutation.mockReturnValue({
      mutate: mockAcceptMutate,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useAcceptInviteMutation>);
  });

  it('shows the accept button when the logged-in email matches the invite, and accepting calls the mutation', () => {
    mockPreview();
    mockSession({
      isAuthenticated: true,
      user: { id: 'u1', email: 'invited@example.com', displayName: 'Invited', role: 'USER' },
    });

    render(<AcceptInvitePageContent token="tok-1" />);

    expect(screen.getByRole('heading', { name: 'Acme Ads' })).toBeInTheDocument();
    const acceptButton = screen.getByRole('button', { name: 'Aceitar convite' });
    fireEvent.click(acceptButton);

    expect(mockAcceptMutate).toHaveBeenCalledWith(undefined, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('hides the accept button and shows a mismatch message when the logged-in email differs', () => {
    mockPreview();
    mockSession({
      isAuthenticated: true,
      user: { id: 'u2', email: 'someone-else@example.com', displayName: 'Someone', role: 'USER' },
    });

    render(<AcceptInvitePageContent token="tok-1" />);

    expect(screen.queryByRole('button', { name: 'Aceitar convite' })).not.toBeInTheDocument();
    expect(screen.getByText('someone-else@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('invited@example.com').length).toBeGreaterThan(0);
  });

  it('shows the invalid card for an expired invite', () => {
    mockPreview({ status: 'EXPIRED' });
    mockSession();

    render(<AcceptInvitePageContent token="tok-1" />);

    expect(screen.getByText('Convite inválido ou expirado')).toBeInTheDocument();
    expect(screen.getByText('Este convite expirou. Peça um novo convite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceitar convite' })).not.toBeInTheDocument();
  });

  it('shows the invalid card when the preview lookup 404s', () => {
    mockPreview({}, { isAxiosError: true, response: { status: 404, data: {} } });
    mockSession();

    render(<AcceptInvitePageContent token="tok-1" />);

    expect(screen.getByText('Convite inválido ou expirado')).toBeInTheDocument();
    expect(screen.getByText('Este convite não existe ou já foi removido.')).toBeInTheDocument();
  });

  it('shows login/signup CTAs with the invite-aware redirect and prefilled email when logged out', () => {
    mockPreview();
    mockSession();

    render(<AcceptInvitePageContent token="tok-1" />);

    const signupLink = screen.getByRole('link', { name: 'Criar conta e aceitar' });
    const loginLink = screen.getByRole('link', { name: 'Já tenho conta' });

    expect(signupLink).toHaveAttribute(
      'href',
      '/signup?email=invited%40example.com&redirect=%2Finvite%2Ftok-1',
    );
    expect(loginLink).toHaveAttribute('href', '/login?redirect=%2Finvite%2Ftok-1');
  });
});
