import type { Metadata } from 'next';
import { SettingsPage } from '@/features/settings/components/SettingsPage';

export const metadata: Metadata = { title: 'Configurações' };

export default function SettingsRoute() {
  return <SettingsPage />;
}
