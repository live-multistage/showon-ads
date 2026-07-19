import { AccountPage } from '@/features/advertisers/components/AccountPage';
import { ActiveAdvertiserAccountProvider } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';

export default function AccountRoute() {
  return (
    <ActiveAdvertiserAccountProvider>
      <AccountPage />
    </ActiveAdvertiserAccountProvider>
  );
}
