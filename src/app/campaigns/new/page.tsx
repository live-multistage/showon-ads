import { CampaignWizard } from '@/features/campaigns/components/CampaignWizard';
import { ActiveAdvertiserAccountProvider } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';

// Mounted per-page like the '/' campaign list, rather than lifted into the
// root layout: AuthGuard already gates every non-public route on having at
// least one advertiser account, so by the time this page renders the query
// this provider wraps is already warm in the React Query cache. Task 19's
// submit step reads useActiveAdvertiserAccount() from here to fill
// CreateAdRequest#advertiserAccountId.
export default function NewCampaignPage() {
  return (
    <ActiveAdvertiserAccountProvider>
      <CampaignWizard />
    </ActiveAdvertiserAccountProvider>
  );
}
