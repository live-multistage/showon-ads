'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignupForm } from './SignupForm';
import { AdvertiserOnboardingForm } from './AdvertiserOnboardingForm';
import { safeRedirectTarget } from '../utils/safe-redirect';

type SignupStep = 'account' | 'company';

// Two-step signup: user-create (SignupForm) then advertiser-create, reusing
// the exact same AdvertiserOnboardingForm the AuthGuard shows to existing
// users who still have zero advertiser accounts.
export function SignupFlow() {
  const [step, setStep] = useState<SignupStep>('account');
  const searchParams = useSearchParams();
  const redirectTarget = safeRedirectTarget(searchParams.get('redirect'));

  if (step === 'company') {
    return (
      <AdvertiserOnboardingForm
        title="Name your advertiser account"
        description="One more step — tell us who you're advertising for."
        // Full-document navigation so the persistent AuthGuard remounts and
        // reads the now-authenticated session (see LoginForm for the rationale).
        onSuccess={() => window.location.assign(redirectTarget)}
      />
    );
  }

  return <SignupForm initialEmail={searchParams.get('email')} onRegistered={() => setStep('company')} />;
}
