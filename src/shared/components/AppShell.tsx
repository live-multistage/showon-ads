'use client';

import { Button, Logo } from '@live-show/design-system';
import { useSession } from '@/features/auth/hooks/use-session';
import styles from './AppShell.module.scss';

// Minimal nav shell for the Ads Manager. Guarding lives one level up
// (AuthGuard, wrapped around {children} by RootLayout) — this component only
// renders the nav and the current session's logout affordance.
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useSession();

  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <Logo size={28} showWordmark={false} />
        <span className={styles.brand}>Ads Manager</span>
        {isAuthenticated && (
          <Button variant="ghost" size="sm" className={styles.logoutBtn} onClick={logout}>
            Log out
          </Button>
        )}
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
