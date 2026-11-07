import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingPage } from './BillingPage';

const walletRefetchMock = vi.fn();
const transactionsRefetchMock = vi.fn();
const createTopUpMutateMock = vi.fn();

const walletState: { data?: { balanceCents: number; currency: string; lowBalance: boolean }; isLoading: boolean; isError: boolean; isFetching: boolean } = {
  data: { balanceCents: 12345, currency: 'BRL', lowBalance: true },
  isLoading: false,
  isError: false,
  isFetching: false,
};

const baseTransactions = [
  { id: 't1', type: 'TOPUP', amountCents: 20000, reference: 'pi_1', createdAt: '2026-08-20T10:00:00Z' },
  { id: 't2', type: 'DEBIT', amountCents: -7655, reference: 'a1:PRE_ROLL:2026-08-21', createdAt: '2026-08-21T10:00:00Z' },
];
const transactionsState: { data: typeof baseTransactions } = { data: baseTransactions };

vi.mock('../queries/use-wallet', () => ({
  useAdvertiserSettingsQuery: () => ({ data: { minTopupCents: 5000, lowBalanceThresholdCents: 2000 } }),
  useWalletQuery: () => ({ ...walletState, refetch: walletRefetchMock }),
  useWalletTransactionsQuery: () => ({
    data: transactionsState.data,
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
const router = { replace: routerReplaceMock };
let searchParamsValue = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => router,
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
    walletState.data = { balanceCents: 12345, currency: 'BRL', lowBalance: true };
    walletState.isLoading = false;
    walletState.isError = false;
    walletState.isFetching = false;
    transactionsState.data = baseTransactions;
    vi.useRealTimers();
  });

  it('shows the wallet balance in BRL', () => {
    render(<BillingPage />);
    expect(screen.getByText(/R\$\s?123,45/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Carteira' })).toBeInTheDocument();
  });

  it('warns when the balance is low', () => {
    render(<BillingPage />);
    expect(screen.getByRole('status')).toHaveTextContent(/saldo baixo/i);
  });

  it('lists the transaction history', () => {
    render(<BillingPage />);
    const history = within(screen.getByRole('list'));
    expect(history.getByText(/R\$\s?200,00/)).toBeInTheDocument();
    expect(history.getByText(/-\s?R\$\s?76,55/)).toBeInTheDocument();
  });

  it('offers presets from R$ 50, a free amount and card-only payment', () => {
    render(<BillingPage />);
    for (const label of [/R\$\s?50,00/, /R\$\s?100,00/, /R\$\s?500,00/]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText('Valor da recarga')).toHaveValue('200,00');
    expect(screen.getByText('Cartão de crédito')).toBeInTheDocument();
    expect(screen.queryByText(/pix/i)).toBeNull();
    expect(screen.getByRole('button', { name: /pagar r\$\s?200,00 com cartão/i })).toBeEnabled();
  });

  it('blocks a top-up below the minimum and explains why', () => {
    render(<BillingPage />);
    fireEvent.change(screen.getByLabelText('Valor da recarga'), { target: { value: '20' } });
    expect(screen.getByText(/valor mínimo de recarga é R\$\s?50,00/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pagar com cartão/i })).toBeDisabled();
  });

  it('a preset fills the amount', () => {
    render(<BillingPage />);
    fireEvent.click(screen.getByRole('button', { name: /R\$\s?100,00/ }));
    expect(screen.getByLabelText('Valor da recarga')).toHaveValue('100,00');
  });

  it('shows a zero-balance error banner', () => {
    walletState.data = { balanceCents: 0, currency: 'BRL', lowBalance: true };
    render(<BillingPage />);
    expect(screen.getByRole('status')).toHaveTextContent(/saldo zerado/i);
  });

  it('shows an error state with retry instead of a fake zero balance', () => {
    walletState.data = undefined;
    walletState.isError = true;
    render(<BillingPage />);
    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar a carteira/i);
    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    expect(walletRefetchMock).toHaveBeenCalled();
  });

  it('shows a confirming state while the wallet refetches after checkout', () => {
    searchParamsValue = new URLSearchParams('topup=success&session_id=cs_1');
    transactionsState.data = [];
    render(<BillingPage />);
    expect(screen.getByRole('status')).toHaveTextContent(/confirmando o pagamento/i);
  });

  it('polls wallet and history every 2s while confirming, then warns after 30s without a TOPUP', () => {
    vi.useFakeTimers();
    searchParamsValue = new URLSearchParams('topup=success&session_id=cs_1');
    render(<BillingPage />);

    act(() => vi.advanceTimersByTime(4000));
    expect(walletRefetchMock).toHaveBeenCalledTimes(2);
    expect(transactionsRefetchMock).toHaveBeenCalledTimes(2);

    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole('status')).toHaveTextContent(/ainda confirmando/i);
    const calls = walletRefetchMock.mock.calls.length;
    act(() => vi.advanceTimersByTime(10_000));
    expect(walletRefetchMock.mock.calls.length).toBe(calls);
  });

  it('shows "pagamento não concluído" when checkout is cancelled', () => {
    searchParamsValue = new URLSearchParams('topup=cancelled');
    render(<BillingPage />);
    expect(screen.getByRole('status')).toHaveTextContent(/pagamento não concluído/i);
    expect(routerReplaceMock).toHaveBeenCalledWith('/billing');
  });

  it('surfaces the backend error message when the top-up fails', () => {
    render(<BillingPage />);
    fireEvent.click(screen.getByRole('button', { name: /pagar r\$\s?200,00 com cartão/i }));

    const [cents, options] = createTopUpMutateMock.mock.calls[0];
    expect(cents).toBe(20000);
    options.onError({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Valor mínimo é R$ 10,00' } },
      message: 'Request failed with status code 400',
    });

    expect(toastErrorMock).toHaveBeenCalledWith('Valor mínimo é R$ 10,00');
  });

  it('confirms the checkout return and strips session_id from the URL', () => {
    searchParamsValue = new URLSearchParams('topup=success&session_id=cs_test_123');
    transactionsState.data = [
      ...baseTransactions,
      { id: 't9', type: 'TOPUP', amountCents: 20000, reference: 'pi_9', createdAt: new Date(Date.now() + 1000).toISOString() },
    ];
    render(<BillingPage />);

    expect(screen.getByRole('status')).toHaveTextContent(/recarga confirmada/i);
    expect(routerReplaceMock).toHaveBeenCalledWith('/billing');
  });

  it('does not touch the URL when there is no checkout return', () => {
    render(<BillingPage />);

    expect(routerReplaceMock).not.toHaveBeenCalled();
  });
});
