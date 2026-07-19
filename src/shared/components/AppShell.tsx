'use client';

import { usePathname } from 'next/navigation';
import { Button, Logo } from '@live-show/design-system';
import { useSession } from '@/features/auth/hooks/use-session';
import styles from './AppShell.module.scss';

// The auth screens render their own full-bleed brand layout (AdsMarketingPanel),
// so the nav chrome is suppressed there — same as the main app's login.
const CHROMELESS_PATHS = new Set(['/login', '/signup']);

// Minimal nav shell for the Ads Manager. Guarding lives one level up
// (AuthGuard, wrapped around {children} by RootLayout) — this component only
// renders the nav and the current session's logout affordance.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useSession();

  if (CHROMELESS_PATHS.has(pathname ?? '')) {
    return <>{children}</>;
  }

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
