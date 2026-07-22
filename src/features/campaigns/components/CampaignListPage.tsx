'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  SimpleCustomSelect,
  type SelectOption,
} from '@live-show/design-system';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
import { useListAdsQuery } from '@/features/advertisements/queries/use-list-ads';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import type { AdResponse } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, STATUS_BADGE_VARIANT, FORMAT_LABEL, destinationLabel } from '../utils/ad-display';
import styles from './CampaignListPage.module.scss';

function formatPeriod(startsAt: string, endsAt: string): string {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

// The list endpoint carries no impression/click/CTR data — those live behind
// the per-ad report endpoint — so aggregate metric cards show a placeholder
// rather than a fabricated number. Wire them once a list-metrics endpoint exists.
const NO_DATA = '—';

export function CampaignListPage() {
  const { data: ads = [], isLoading: isAdsLoading } = useListAdsQuery();
  const { accounts, activeAccountId, setActiveAccountId, isLoading: isAccountsLoading } =
    useActiveAdvertiserAccount();
  const [query, setQuery] = useState('');

  const isLoading = isAdsLoading || isAccountsLoading || (accounts.length > 0 && activeAccountId === null);

  const campaigns = useMemo(
    () => (activeAccountId ? ads.filter((ad) => ad.advertiserAccountId === activeAccountId) : []),
    [ads, activeAccountId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? campaigns.filter((c) => c.title.toLowerCase().includes(q)) : campaigns;
  }, [campaigns, query]);

  const accountOptions: SelectOption[] = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Campanhas</h1>
          <p className={styles.subtitle}>Gerencie seus anúncios e acompanhe a performance</p>
        </div>
        <Button asChild className={styles.newBtn}>
          <Link href="/campaigns/new">
            <span aria-hidden>+ </span>Nova campanha
          </Link>
        </Button>
      </header>

      <section className={styles.stats}>
        <StatCard icon="campaigns" label="CAMPANHAS" value={isLoading ? NO_DATA : String(campaigns.length)} />
        <StatCard icon="impressions" label="IMPRESSÕES" value={NO_DATA} />
        <StatCard icon="clicks" label="CLIQUES" value={NO_DATA} />
        <StatCard icon="ctr" label="CTR MÉDIO" value={NO_DATA} accent />
      </section>

      <div className={styles.toolbar}>
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
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            className={styles.search}
            placeholder="Buscar campanhas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className={styles.skeletonList} aria-label="Carregando campanhas">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {!isLoading && campaigns.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhuma campanha criada ainda.</p>
          <p className={styles.emptyText}>
            Crie sua primeira campanha para começar a promover seus shows.
          </p>
          <Button asChild className={styles.newBtn}>
            <Link href="/campaigns/new">Criar primeira campanha</Link>
          </Button>
        </div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>CAMPANHA</span>
            <span>STATUS</span>
            <span>FORMATO</span>
            <span>DESTINO</span>
            <span>PERÍODO</span>
            <span className={styles.right}>ORÇAMENTO</span>
          </div>
          {filtered.map((ad) => (
            <CampaignRow key={ad.id} ad={ad} />
          ))}
          {filtered.length === 0 && (
            <div className={styles.noMatch}>Nenhuma campanha corresponde à busca.</div>
          )}
        </div>
      )}
    </div>
  );
}

const statSvg = (path: React.ReactNode) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);
const STAT_ICON: Record<string, React.ReactNode> = {
  campaigns: statSvg(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>),
  impressions: statSvg(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  clicks: statSvg(<><path d="M9 9l5 12 1.8-5.2L21 14 9 9z" /><path d="M7.2 2.2 8 5M5.9 4.6 4 6.5M2.2 7.2 5 8" /></>),
  ctr: statSvg(<><path d="M3 17l5-5 4 4 8-9" /><path d="M14 7h6v6" /></>),
};

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCardAccent : ''}`}>
      {accent && <div className={styles.statGlow} />}
      <div className={styles.statLabel}>
        <span className={styles.statIcon}>{STAT_ICON[icon]}</span>
        {label}
      </div>
      <div className={`${styles.statValue} ${accent ? styles.statValueAccent : ''}`}>{value}</div>
    </div>
  );
}

function CampaignRow({ ad }: { ad: AdResponse }) {
  return (
    <Link href={`/campaigns/${ad.id}`} className={styles.row}>
      <span className={styles.cellTitle}>{ad.title}</span>
      <span>
        <Badge variant={STATUS_BADGE_VARIANT[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>
      </span>
      <span className={styles.cellMono}>{FORMAT_LABEL[ad.format]}</span>
      <span className={ad.destination ? styles.cellMono : styles.cellHint}>
        {destinationLabel(ad.destination)}
      </span>
      <span className={styles.cellMono}>{formatPeriod(ad.startsAt, ad.endsAt)}</span>
      <span className={`${styles.cellMono} ${styles.right}`}>
        {formatCentsToBRL(ad.totalSpendCents)} / {formatCentsToBRL(ad.totalLimitCents)}
      </span>
    </Link>
  );
}
