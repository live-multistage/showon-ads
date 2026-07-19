import type { Metadata } from 'next';
import { Providers } from '@/shared/providers';
import { AppShell } from '@/shared/components/AppShell';
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
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
