import type { Metadata } from 'next';
import { VerifyEmailContent } from '@/features/auth/components/VerifyEmailContent';

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

// The URL carries the token, so it must never leak in a Referer header.
export const metadata: Metadata = { title: 'Confirmação de e-mail', referrer: 'no-referrer' };

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  return <VerifyEmailContent token={token} />;
}
