'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignupForm } from './SignupForm';
import { AdvertiserOnboardingForm } from './AdvertiserOnboardingForm';

type SignupStep = 'account' | 'company';

// Two-step signup: user-create (SignupForm) then advertiser-create, reusing
// the exact same AdvertiserOnboardingForm the AuthGuard shows to existing
// users who still have zero advertiser accounts.
export function SignupFlow() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('account');

  if (step === 'company') {
    return (
      <AdvertiserOnboardingForm
        title="Name your advertiser account"
        description="One more step — tell us who you're advertising for."
        onSuccess={() => router.push('/')}
      />
    );
  }

  return <SignupForm onRegistered={() => setStep('company')} />;
}
