import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AppShell } from './AppShell';

const pathname = { value: '/' };
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));
const logout = vi.fn();
vi.mock('@/features/auth/hooks/use-session', () => ({
  useSession: () => ({ isAuthenticated: true, user: { displayName: 'Bruna', email: 'b@x.com' }, logout }),
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

    expect(screen.getAllByRole('img', { name: 'showon.io' }).length).toBeGreaterThan(0);
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('menu has only Campanhas, Carteira and Conta', () => {
    render(<AppShell>x</AppShell>);
    const labels = within(screen.getByRole('navigation', { name: 'Menu principal' }))
      .getAllByRole('link')
      .map((a) => a.textContent);
    expect(labels).toHaveLength(3);
    expect(labels[0]).toBe('Campanhas');
    expect(labels[1]).toMatch(/^Carteira/);
    expect(labels[2]).toBe('Conta');
    expect(screen.queryByText('Relatórios')).toBeNull();
    expect(screen.queryByText('Configurações')).toBeNull();
  });

  it('shows the wallet balance next to Carteira', () => {
    render(<AppShell>x</AppShell>);
    expect(within(screen.getByRole('navigation', { name: 'Menu principal' })).getByRole('link', { name: /carteira/i })).toHaveTextContent(/R\$\s?200,00/);
  });

  it('hides the balance until the wallet loads', () => {
    wallet.data = undefined;
    render(<AppShell>x</AppShell>);
    expect(within(screen.getByRole('navigation', { name: 'Menu principal' })).getByRole('link', { name: /carteira/i })).toHaveTextContent(/^Carteira$/);
  });

  it('labels the logout button in Portuguese', () => {
    render(<AppShell>x</AppShell>);
    expect(screen.queryByText('Log out')).toBeNull();
    for (const button of screen.getAllByRole('button', { name: 'Sair' })) {
      button.click();
    }
    expect(logout).toHaveBeenCalled();
  });

  describe('phone chrome (<= 820px, styled in CSS)', () => {
    it('has a top bar with the logo and a balance link to the wallet', () => {
      render(<AppShell>x</AppShell>);
      const top = screen.getByRole('banner');
      expect(within(top).getByRole('img', { name: 'showon.io' })).toBeInTheDocument();
      const balance = within(top).getByRole('link', { name: /saldo/i });
      expect(balance).toHaveAttribute('href', '/billing');
      expect(balance).toHaveTextContent(/R\$\s?200,00/);
    });

    it('shows a low-balance style hook when the wallet is empty', () => {
      wallet.data = { balanceCents: 0 };
      render(<AppShell>x</AppShell>);
      expect(within(screen.getByRole('banner')).getByRole('link', { name: /saldo/i }).className).toMatch(/low/i);
    });

    it('hides the balance until the wallet loads', () => {
      wallet.data = undefined;
      render(<AppShell>x</AppShell>);
      expect(within(screen.getByRole('banner')).queryByRole('link', { name: /saldo/i })).toBeNull();
    });

    it('keeps the three-item nav as the bottom bar', () => {
      render(<AppShell>x</AppShell>);
      expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument();
    });
  });
});
