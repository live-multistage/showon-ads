'use client';

import { useMemo } from 'react';
import { useListAdsQuery } from '@/features/advertisements/queries/use-list-ads';
import { useAdReportQuery } from '@/features/advertisements/queries/use-ad-report';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import type { AdResponse, AdStatus } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, destinationLabel } from '../utils/ad-display';
import styles from './ReportsPage.module.scss';

const intFmt = new Intl.NumberFormat('pt-BR');

const FORMAT_SHORT: Record<string, string> = {
  HORIZONTAL_728x90: '728×90',
  VERTICAL_300x600: '300×600',
};

// Preview gradient derived from the ad id — stable per campaign, same idea as
// the viewer-side AdBanner placeholder.
const GRADIENTS = [
  'linear-gradient(135deg,#ff2e9e,#9b7bff)',
  'linear-gradient(135deg,#9b7bff,#46d6d8)',
  'linear-gradient(135deg,#ff7a4d,#ff2e9e)',
  'linear-gradient(135deg,#46d6d8,#7fe0a0)',
  'linear-gradient(135deg,#9810fa,#ff2e9e)',
];
function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

// Status pill style per state — mirrors DESIGN_SYSTEM.md §5 status pill
// (magenta / violet / neutral / red tints).
const STATUS_PILL: Record<AdStatus, { className: string; live?: boolean }> = {
  ACTIVE: { className: styles.pillLive, live: true },
  REVIEW: { className: styles.pillReview },
  DRAFT: { className: styles.pillNeutral },
  PAUSED: { className: styles.pillNeutral },
  ENDED: { className: styles.pillNeutral },
  REJECTED: { className: styles.pillRejected },
};

function fmtPeriod(startsAt: string, endsAt: string): string {
  const f = (v: string) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${f(startsAt)}–${f(endsAt)}`;
}

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
        <div className={styles.list} aria-label="Carregando relatórios">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <div className={styles.empty}>Nenhuma campanha para relatar ainda.</div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className={styles.list}>
          {campaigns.map((ad) => (
            <ReportCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ ad }: { ad: AdResponse }) {
  const { data: report, isLoading } = useAdReportQuery(ad.id);
  const pill = STATUS_PILL[ad.status];

  const val = (v: string) => (isLoading ? '…' : v);
  const ctr = report?.ctr != null ? `${(report.ctr * 100).toFixed(2)}%` : '—';
  const spentPct =
    ad.totalLimitCents > 0 ? Math.min(100, (ad.totalSpendCents / ad.totalLimitCents) * 100) : 0;

  return (
    <div className={styles.card}>
      <div className={styles.preview} style={{ background: gradientFor(ad.id) }}>
        <span className={styles.previewScrim} />
        <span className={styles.previewFmt}>{FORMAT_SHORT[ad.format] ?? ad.format}</span>
      </div>

      <div className={styles.info}>
        <div className={styles.infoTop}>
          <span className={`${styles.pill} ${pill.className}`}>
            {pill.live && <span className={styles.pillDot} />}
            {STATUS_LABEL[ad.status]}
          </span>
          <span className={styles.dest}>{destinationLabel(ad.destination)}</span>
        </div>
        <div className={styles.cardTitle}>{ad.title}</div>
        <div className={styles.meta}>
          <span>
            <span className={styles.metaKey}>BID</span> {ad.billingModel}
          </span>
          <span>
            <span className={styles.metaKey}>PER</span> {fmtPeriod(ad.startsAt, ad.endsAt)}
          </span>
        </div>
      </div>

      <div className={styles.metrics}>
        <Stat label="IMPRESS." value={val(intFmt.format(report?.impressions ?? 0))} />
        <Stat label="CLIQUES" value={val(intFmt.format(report?.clicks ?? 0))} />
        <Stat label="CTR" value={val(ctr)} accent />
        <Stat label="GASTO" value={val(formatCentsToBRL(report?.spendCents ?? 0))} pink />
      </div>

      <div className={styles.budget}>
        <span className={styles.budgetText}>
          {formatCentsToBRL(ad.totalSpendCents)} / {formatCentsToBRL(ad.totalLimitCents)}
        </span>
        <span className={styles.budgetBar}>
          <span className={styles.budgetFill} style={{ width: `${spentPct}%` }} />
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, pink }: { label: string; value: string; accent?: boolean; pink?: boolean }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${accent ? styles.statAccent : ''} ${pink ? styles.statPink : ''}`}>
        {value}
      </div>
    </div>
  );
}
