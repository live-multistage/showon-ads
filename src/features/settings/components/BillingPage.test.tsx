import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BillingPage } from './BillingPage';

vi.mock('../queries/use-wallet', () => ({
  useWalletQuery: () => ({ data: { balanceCents: 12345, currency: 'BRL', lowBalance: true }, isLoading: false }),
  useWalletTransactionsQuery: () => ({
    data: [
      { id: 't1', type: 'TOPUP', amountCents: 20000, reference: 'pi_1', createdAt: '2026-08-20T10:00:00Z' },
      { id: 't2', type: 'DEBIT', amountCents: -7655, reference: 'a1:PRE_ROLL:2026-08-21', createdAt: '2026-08-21T10:00:00Z' },
    ],
    isLoading: false,
  }),
  useCreateTopUpMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/advertisers/providers/ActiveAdvertiserAccountProvider', () => ({
  useActiveAdvertiserAccount: () => ({
    accounts: [],
    activeAccountId: 'acc-1',
    setActiveAccountId: vi.fn(),
    isLoading: false,
  }),
}));

describe('BillingPage', () => {
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
});
