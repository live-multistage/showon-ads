import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SignupFlow } from '@/features/auth/components/SignupFlow';

export const metadata: Metadata = { title: 'Sign up' };

export default function SignupPage() {
  return (
    <Suspense>
      <SignupFlow />
    </Suspense>
  );
}
