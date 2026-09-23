import type { Metadata } from 'next';
import { CampaignDetailPage } from '@/features/campaigns/components/CampaignDetailPage';

export const metadata: Metadata = { title: 'Detalhes da campanha' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailRoute({ params }: Props) {
  const { id } = await params;
  return <CampaignDetailPage id={id} />;
}
