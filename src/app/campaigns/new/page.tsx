import type { Metadata } from 'next';
import { CampaignWizard } from '@/features/campaigns/components/CampaignWizard';

export const metadata: Metadata = { title: 'Nova campanha' };

export default function NewCampaignPage() {
  return <CampaignWizard />;
}
