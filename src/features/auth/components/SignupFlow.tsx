'use client';

import { useSearchParams } from 'next/navigation';
import { SignupForm } from './SignupForm';

// Registration only creates the (unverified) account now — there is no
// session to chain into an advertiser-create step. The company-name step
// (AdvertiserOnboardingForm) happens after the user verifies their email and
// logs in, via AuthGuard, which shows it to any authenticated user with zero
// advertiser accounts.
export function SignupFlow() {
  const searchParams = useSearchParams();
  return <SignupForm initialEmail={searchParams.get('email')} />;
}
