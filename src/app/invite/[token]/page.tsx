import type { Metadata } from 'next';
import { AcceptInvitePageContent } from '@/features/advertisers/components/AcceptInvitePageContent';

export const metadata: Metadata = { title: 'Aceitar convite' };

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InviteAcceptRoute({ params }: Props) {
  const { token } = await params;
  return <AcceptInvitePageContent token={token} />;
}
