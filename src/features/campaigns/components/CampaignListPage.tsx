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
import type { AdResponse } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, STATUS_BADGE_VARIANT, FORMAT_LABEL, destinationLabel } from '../utils/ad-display';
import styles from './CampaignListPage.module.scss';

function formatPeriod(startsAt: string, endsAt: string): string {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

export function CampaignListPage() {
  const { data: ads = [], isLoading: isAdsLoading } = useListAdsQuery();
  const { accounts, activeAccountId, setActiveAccountId, isLoading: isAccountsLoading } =
    useActiveAdvertiserAccount();

  // ponytail: accounts resolve before ActiveAdvertiserAccountProvider's effect sets
  // activeAccountId, so treat that gap as loading too or the empty state flashes.
  const isLoading = isAdsLoading || isAccountsLoading || (accounts.length > 0 && activeAccountId === null);
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
