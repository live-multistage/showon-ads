import type { Metadata } from 'next';
import { AccountPage } from '@/features/advertisers/components/AccountPage';

export const metadata: Metadata = { title: 'Conta' };

export default function AccountRoute() {
  return <AccountPage />;
}
