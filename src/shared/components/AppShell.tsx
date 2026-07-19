import { Logo } from '@live-show/design-system';
import styles from './AppShell.module.scss';

// Minimal nav shell for the Ads Manager booting shell — no feature pages yet
// (those land in later tasks). Kept as a plain server component, separate
// from RootLayout's <html>/<body>, so it's renderable directly in RTL.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <Logo size={28} showWordmark={false} />
        <span className={styles.brand}>Ads Manager</span>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
