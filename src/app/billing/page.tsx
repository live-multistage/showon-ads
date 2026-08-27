import { Suspense } from 'react';
import { BillingPage } from '@/features/settings/components/BillingPage';

export default function BillingRoute() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  );
}
