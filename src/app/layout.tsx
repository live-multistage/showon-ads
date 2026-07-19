import type { Metadata } from 'next';
import { Providers } from '@/shared/providers';
import { AppShell } from '@/shared/components/AppShell';
import { AuthGuard } from '@/shared/components/AuthGuard';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: {
    default: 'Ads Manager',
    template: '%s · Ads Manager',
  },
  description: 'Ads Manager for live-show advertisers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <AppShell>
            <AuthGuard>{children}</AuthGuard>
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
