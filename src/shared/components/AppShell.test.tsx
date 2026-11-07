import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

const pathname = { value: '/' };
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));
vi.mock('@/features/auth/hooks/use-session', () => ({
  useSession: () => ({ isAuthenticated: true, user: { displayName: 'Bruna', email: 'b@x.com' }, logout: vi.fn() }),
}));
vi.mock('@/features/advertisers/providers/ActiveAdvertiserAccountProvider', () => ({
  useActiveAdvertiserAccount: () => ({ activeAccountId: 'acc-1' }),
}));
const wallet: { data?: { balanceCents: number } } = { data: { balanceCents: 20000 } };
vi.mock('@/features/settings/queries/use-wallet', () => ({ useWalletQuery: () => wallet }));

describe('AppShell', () => {
  beforeEach(() => {
    pathname.value = '/';
    wallet.data = { balanceCents: 20000 };
  });

  it('renders the nav branding and children', () => {
    render(
      <AppShell>
        <p>page content</p>
      </AppShell>,
    );

    expect(screen.getByRole('img', { name: 'showon.io' })).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('menu has only Campanhas, Carteira and Conta', () => {
    render(<AppShell>x</AppShell>);
    const labels = screen.getAllByRole('link').map((a) => a.textContent);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toBe('Campanhas');
    expect(labels[1]).toMatch(/^Carteira/);
    expect(labels[2]).toBe('Conta');
    expect(screen.queryByText('Relatórios')).toBeNull();
    expect(screen.queryByText('Configurações')).toBeNull();
  });

  it('shows the wallet balance next to Carteira', () => {
    render(<AppShell>x</AppShell>);
    expect(screen.getByRole('link', { name: /carteira/i })).toHaveTextContent(/R\$\s?200,00/);
  });

  it('hides the balance until the wallet loads', () => {
    wallet.data = undefined;
    render(<AppShell>x</AppShell>);
    expect(screen.getByRole('link', { name: /carteira/i })).toHaveTextContent(/^Carteira$/);
  });
});
