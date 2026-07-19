'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyAdvertiserAccountsQuery } from '@/features/advertisements/queries/use-my-advertiser-accounts';
import { AdvertiserOnboardingForm } from '@/features/auth/components/AdvertiserOnboardingForm';

// Login/signup manage their own auth state and must render regardless of
// session — there is no server-side token verification possible here (the
// session lives in localStorage, unreachable from Next.js middleware), so
// this is a client-side redirect guard, not a real access boundary. The
// orchestrator API is the actual authorization boundary.
const PUBLIC_PATHS = new Set(['/login', '/signup']);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: isSessionLoading } = useSession();
  const isPublicPath = PUBLIC_PATHS.has(pathname ?? '');

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated && !isPublicPath) {
      router.replace('/login');
    }
  }, [isSessionLoading, isAuthenticated, isPublicPath, router]);

  const shouldCheckAdvertiserAccounts = isAuthenticated && !isPublicPath;
  const { data: advertiserAccounts, isLoading: isAccountsLoading } = useMyAdvertiserAccountsQuery({
    enabled: shouldCheckAdvertiserAccounts,
  });

  if (isPublicPath) return <>{children}</>;
  if (isSessionLoading || !isAuthenticated) return null;
  if (isAccountsLoading) return null;

  if ((advertiserAccounts?.length ?? 0) === 0) {
    return (
      <AdvertiserOnboardingForm
        title="Create your advertiser account"
        description="You need an advertiser account before you can continue."
      />
    );
  }

  return <>{children}</>;
}
