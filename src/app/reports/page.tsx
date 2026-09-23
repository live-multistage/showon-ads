import type { Metadata } from 'next';
import { ReportsPage } from '@/features/campaigns/components/ReportsPage';

export const metadata: Metadata = { title: 'Relatórios' };

export default function ReportsRoute() {
  return <ReportsPage />;
}
