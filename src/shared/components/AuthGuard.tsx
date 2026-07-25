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

// Invite accept pages must render for logged-out visitors (they preview the
// invite before choosing signup/login) AND for freshly-signed-up members who
// have zero advertiser accounts yet — the invite IS how they get their first
// one, so the "create your advertiser account" onboarding gate below must not
// intercept them.
function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/invite/');
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: isSessionLoading } = useSession();
  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated && !isPublic) {
      router.replace('/login');
    }
  }, [isSessionLoading, isAuthenticated, isPublic, router]);

  const shouldCheckAdvertiserAccounts = isAuthenticated && !isPublic;
  const { data: advertiserAccounts, isLoading: isAccountsLoading } = useMyAdvertiserAccountsQuery({
    enabled: shouldCheckAdvertiserAccounts,
  });

  if (isPublic) return <>{children}</>;
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
