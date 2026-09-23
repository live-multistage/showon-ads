import type { Metadata } from 'next';
import { CampaignListPage } from '@/features/campaigns/components/CampaignListPage';

export const metadata: Metadata = { title: 'Campanhas' };

export default function HomePage() {
  return <CampaignListPage />;
}
