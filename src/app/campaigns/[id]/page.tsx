import { CampaignDetailPage } from '@/features/campaigns/components/CampaignDetailPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailRoute({ params }: Props) {
  const { id } = await params;
  return <CampaignDetailPage id={id} />;
}
