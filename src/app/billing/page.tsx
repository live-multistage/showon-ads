import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BillingPage } from '@/features/settings/components/BillingPage';

export const metadata: Metadata = { title: 'Carteira' };

export default function BillingRoute() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  );
}
