'use client';

import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  SimpleCustomSelect,
  type SelectOption,
} from '@live-show/design-system';
import { useListAdsQuery } from '@/features/advertisements/queries/use-list-ads';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import type { AdDestination, AdFormat, AdResponse, AdStatus } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import styles from './CampaignListPage.module.scss';

const STATUS_LABEL: Record<AdStatus, string> = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em análise',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  ENDED: 'Encerrado',
  REJECTED: 'Rejeitado',
};

const STATUS_BADGE_VARIANT: Record<AdStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  REVIEW: 'secondary',
  ACTIVE: 'default',
  PAUSED: 'outline',
  ENDED: 'secondary',
  REJECTED: 'destructive',
};

const FORMAT_LABEL: Record<AdFormat, string> = {
  HORIZONTAL_728x90: 'Horizontal 728×90',
  VERTICAL_300x600: 'Vertical 300×600',
};

function formatPeriod(startsAt: string, endsAt: string): string {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

function destinationLabel(destination: AdDestination | null): string {
  if (!destination) return 'Sem destino';
  return destination.type === 'EVENT' ? 'Evento' : 'URL externa';
}

export function CampaignListPage() {
  const { data: ads = [], isLoading: isAdsLoading } = useListAdsQuery();
  const { accounts, activeAccountId, setActiveAccountId, isLoading: isAccountsLoading } =
    useActiveAdvertiserAccount();

  const isLoading = isAdsLoading || isAccountsLoading;
  const campaigns = activeAccountId
    ? ads.filter((ad) => ad.advertiserAccountId === activeAccountId)
    : [];

  const accountOptions: SelectOption[] = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Campanhas</h1>
          <p className={styles.subtitle}>Gerencie suas campanhas de anúncios</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">Nova campanha</Link>
        </Button>
      </header>

      {accounts.length > 1 && (
        <div className={styles.accountSwitcher}>
          <SimpleCustomSelect
            value={activeAccountId ?? undefined}
            onValueChange={setActiveAccountId}
            options={accountOptions}
            placeholder="Selecione uma conta"
          />
        </div>
      )}

      {isLoading && (
        <div className={styles.list} aria-label="Carregando campanhas">
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
          <Skeleton className={styles.skeletonRow} />
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <Card>
          <CardContent className={styles.empty}>
            <p>Nenhuma campanha criada ainda.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className={styles.list}>
          {campaigns.map((ad) => (
            <CampaignRow key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignRow({ ad }: { ad: AdResponse }) {
  return (
    <Link href={`/campaigns/${ad.id}`} className={styles.row}>
      <Card className={styles.rowCard}>
        <CardContent className={styles.rowContent}>
          <div className={styles.rowMain}>
            <span className={styles.rowTitle}>{ad.title}</span>
            <span className={styles.rowMeta}>
              {FORMAT_LABEL[ad.format]} · {formatPeriod(ad.startsAt, ad.endsAt)} ·{' '}
              <span className={ad.destination ? undefined : styles.rowDestinationHint}>
                {destinationLabel(ad.destination)}
              </span>
            </span>
          </div>

          <Badge variant={STATUS_BADGE_VARIANT[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>

          <div className={styles.rowSpend}>
            <span className={styles.rowSpendValue}>{formatCentsToBRL(ad.totalSpendCents)}</span>
            <span className={styles.rowSpendLimit}>de {formatCentsToBRL(ad.totalLimitCents)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
