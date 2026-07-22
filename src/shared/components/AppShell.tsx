'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/features/auth/hooks/use-session';
import styles from './AppShell.module.scss';

// Inline icons — a handful of glyphs doesn't justify an icon dependency.
const svg = (size: number, path: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);
const IconGrid = () => svg(18, <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>);
const IconSettings = () => svg(18, <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>);
const IconLogout = () => svg(16, <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>);
const IconUser = () => svg(16, <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>);

// The auth screens render their own full-bleed brand layout (AdsMarketingPanel),
// so the sidebar chrome is suppressed there — same as the main app's login.
const CHROMELESS_PATHS = new Set(['/login', '/signup']);

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: '/',
    label: 'Campanhas',
    icon: <IconGrid />,
    match: (p) => p === '/' || p.startsWith('/campaigns'),
  },
  {
    href: '/account',
    label: 'Configurações',
    icon: <IconSettings />,
    match: (p) => p.startsWith('/account'),
  },
];

// Sidebar shell for the Ads Manager (Ads Manager design). Guarding lives one
// level up (AuthGuard, wrapped around {children} by RootLayout) — this only
// renders the sidebar nav + session footer.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { isAuthenticated, user, logout } = useSession();

  if (CHROMELESS_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.wordmark}>LIVESHOW</div>
          <div className={styles.sublabel}>Ads Manager</div>
        </div>

        <nav className={styles.nav}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${item.match(pathname) ? styles.navItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {isAuthenticated && (
          <button type="button" className={styles.userFooter} onClick={logout}>
            <span className={styles.avatar}>
              <IconUser />
            </span>
            <span className={styles.userInfo}>
              <span className={styles.userName}>{user?.displayName ?? 'Conta'}</span>
              <span className={styles.userEmail}>{user?.email ?? ''}</span>
            </span>
            <span className={styles.logoutIcon}>
              <IconLogout />
            </span>
            <span className={styles.srOnly}>Log out</span>
          </button>
        )}
      </aside>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
