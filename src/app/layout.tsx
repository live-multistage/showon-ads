import type { Metadata } from 'next';
import { Toaster } from '@live-show/design-system';
import { Providers } from '@/shared/providers';
import { AppShell } from '@/shared/components/AppShell';
import { AuthGuard } from '@/shared/components/AuthGuard';
import { PlatformGate } from '@/shared/components/PlatformGate';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: {
    default: 'Showon Ads Manager',
    template: '%s · Showon Ads',
  },
  description: 'Gerencie campanhas de anúncios na Showon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <PlatformGate>
            <AppShell>
              <AuthGuard>{children}</AuthGuard>
            </AppShell>
          </PlatformGate>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
