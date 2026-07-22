'use client';

import { useMemo } from 'react';
import { Badge } from '@live-show/design-system';
import { useListAdsQuery } from '@/features/advertisements/queries/use-list-ads';
import { useAdReportQuery } from '@/features/advertisements/queries/use-ad-report';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import type { AdResponse } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from '../utils/ad-display';
import styles from './ReportsPage.module.scss';

const intFmt = new Intl.NumberFormat('pt-BR');

export function ReportsPage() {
  const { data: ads = [], isLoading: isAdsLoading } = useListAdsQuery();
  const { activeAccountId, accounts, isLoading: isAccountsLoading } = useActiveAdvertiserAccount();

  const isLoading = isAdsLoading || isAccountsLoading || (accounts.length > 0 && activeAccountId === null);
  const campaigns = useMemo(
    () => (activeAccountId ? ads.filter((ad) => ad.advertiserAccountId === activeAccountId) : []),
    [ads, activeAccountId],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
        <p className={styles.subtitle}>Performance de cada campanha (impressões, cliques, CTR e gasto)</p>
      </header>

      {isLoading && (
        <div className={styles.skeletonList} aria-label="Carregando relatórios">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <div className={styles.empty}>Nenhuma campanha para relatar ainda.</div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>CAMPANHA</span>
            <span>STATUS</span>
            <span className={styles.right}>IMPRESSÕES</span>
            <span className={styles.right}>CLIQUES</span>
            <span className={styles.right}>CTR</span>
            <span className={styles.right}>GASTO</span>
          </div>
          {campaigns.map((ad) => (
            <ReportRow key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportRow({ ad }: { ad: AdResponse }) {
  const { data: report, isLoading } = useAdReportQuery(ad.id);

  const cell = (value: string) => (isLoading ? '…' : value);
  const ctr = report?.ctr != null ? `${(report.ctr * 100).toFixed(2)}%` : '—';

  return (
    <div className={styles.row}>
      <span className={styles.cellTitle}>{ad.title}</span>
      <span>
        <Badge variant={STATUS_BADGE_VARIANT[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>
      </span>
      <span className={`${styles.cellMono} ${styles.right}`}>{cell(intFmt.format(report?.impressions ?? 0))}</span>
      <span className={`${styles.cellMono} ${styles.right}`}>{cell(intFmt.format(report?.clicks ?? 0))}</span>
      <span className={`${styles.cellAccent} ${styles.right}`}>{cell(ctr)}</span>
      <span className={`${styles.cellMono} ${styles.right}`}>{cell(formatCentsToBRL(report?.spendCents ?? 0))}</span>
    </div>
  );
}
