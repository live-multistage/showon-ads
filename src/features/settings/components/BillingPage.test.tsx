import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingPage } from './BillingPage';

const walletRefetchMock = vi.fn();
const transactionsRefetchMock = vi.fn();
const createTopUpMutateMock = vi.fn();

vi.mock('../queries/use-wallet', () => ({
  useWalletQuery: () => ({
    data: { balanceCents: 12345, currency: 'BRL', lowBalance: true },
    isLoading: false,
    refetch: walletRefetchMock,
  }),
  useWalletTransactionsQuery: () => ({
    data: [
      { id: 't1', type: 'TOPUP', amountCents: 20000, reference: 'pi_1', createdAt: '2026-08-20T10:00:00Z' },
      { id: 't2', type: 'DEBIT', amountCents: -7655, reference: 'a1:PRE_ROLL:2026-08-21', createdAt: '2026-08-21T10:00:00Z' },
    ],
    isLoading: false,
    refetch: transactionsRefetchMock,
  }),
  useCreateTopUpMutation: () => ({ mutate: createTopUpMutateMock, isPending: false }),
}));

vi.mock('@/features/advertisers/providers/ActiveAdvertiserAccountProvider', () => ({
  useActiveAdvertiserAccount: () => ({
    accounts: [],
    activeAccountId: 'acc-1',
    setActiveAccountId: vi.fn(),
    isLoading: false,
  }),
}));

const routerReplaceMock = vi.fn();
let searchParamsValue = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  useSearchParams: () => searchParamsValue,
}));

const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = new URLSearchParams();
  });

  it('shows the wallet balance in BRL', () => {
    render(<BillingPage />);
    expect(screen.getByText(/R\$\s?123,45/)).toBeInTheDocument();
  });

  it('warns when the balance is low', () => {
    render(<BillingPage />);
    expect(screen.getByRole('status')).toHaveTextContent(/saldo baixo/i);
  });

  it('lists the transaction history', () => {
    render(<BillingPage />);
    expect(screen.getByText(/R\$\s?200,00/)).toBeInTheDocument();
    expect(screen.getByText(/-\s?R\$\s?76,55/)).toBeInTheDocument();
  });

  it('offers an add-funds control', () => {
    render(<BillingPage />);
    expect(screen.getByRole('button', { name: /adicionar créditos/i })).toBeInTheDocument();
  });

  it('surfaces the backend error message when the top-up fails', () => {
    render(<BillingPage />);
    fireEvent.click(screen.getByRole('button', { name: /adicionar créditos/i }));

    const [, options] = createTopUpMutateMock.mock.calls[0];
    options.onError({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Valor mínimo é R$ 10,00' } },
      message: 'Request failed with status code 400',
    });

    expect(toastErrorMock).toHaveBeenCalledWith('Valor mínimo é R$ 10,00');
  });

  it('confirms the checkout return and strips session_id from the URL', () => {
    searchParamsValue = new URLSearchParams('session_id=cs_test_123');
    render(<BillingPage />);

    expect(walletRefetchMock).toHaveBeenCalled();
    expect(transactionsRefetchMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith(expect.stringMatching(/recarga confirmada/i));
    expect(routerReplaceMock).toHaveBeenCalledWith('/billing');
  });

  it('does not touch the URL or toast when there is no session_id', () => {
    render(<BillingPage />);

    expect(routerReplaceMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
