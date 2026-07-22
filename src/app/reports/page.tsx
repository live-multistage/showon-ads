import { ReportsPage } from '@/features/campaigns/components/ReportsPage';
import { ActiveAdvertiserAccountProvider } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';

export default function ReportsRoute() {
  return (
    <ActiveAdvertiserAccountProvider>
      <ReportsPage />
    </ActiveAdvertiserAccountProvider>
  );
}
