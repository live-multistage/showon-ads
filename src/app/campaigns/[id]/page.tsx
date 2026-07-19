import { CampaignDetailPage } from '@/features/campaigns/components/CampaignDetailPage';

interface Props {
  params: Promise<{ id: string }>;
}

// No ActiveAdvertiserAccountProvider here (unlike /campaigns/new): the detail
// page is looked up by ad id directly, and neither it nor EditCampaignForm
// reads useActiveAdvertiserAccount().
export default async function CampaignDetailRoute({ params }: Props) {
  const { id } = await params;
  return <CampaignDetailPage id={id} />;
}
