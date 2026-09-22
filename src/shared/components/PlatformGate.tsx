'use client';

import { EmailStatusCard } from '@/features/auth/components/EmailStatusCard';
import { useFeatureFlagsQuery } from '@/features/feature-flags/queries/use-feature-flags';

// Kill switch for the whole Ads Manager — mounted above AppShell/AuthGuard in
// RootLayout so it covers every route, including /login and /signup. Fail
// open: only an explicit `false` blocks; a failed or still-loading flags
// request never locks advertisers out (loading renders nothing, same as
// AuthGuard, so we never flash the app or the blocked screen).
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const { data: flags, isLoading } = useFeatureFlagsQuery();
  const isBlocked = flags?.advertiser_platform === false;

  if (isLoading) return null;

  if (isBlocked) {
    return (
      <EmailStatusCard
        variant="unavailable"
        eyebrow="PLATAFORMA INDISPONÍVEL"
        title="Anúncios temporariamente indisponíveis"
        message="A plataforma de anúncios está fora do ar no momento. Tente novamente mais tarde."
        secondaryAction={{ label: 'Ir para showon.io', href: 'https://showon.io' }}
      />
    );
  }

  return <>{children}</>;
}
