import { CampaignListPage } from '@/features/campaigns/components/CampaignListPage';
import { ActiveAdvertiserAccountProvider } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';

export default function HomePage() {
  return (
    <ActiveAdvertiserAccountProvider>
      <CampaignListPage />
    </ActiveAdvertiserAccountProvider>
  );
}
