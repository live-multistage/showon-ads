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
        <StatCard label="CAMPANHAS" value={isLoading ? NO_DATA : String(campaigns.length)} />
        <StatCard label="IMPRESSÕES" value={NO_DATA} />
        <StatCard label="CLIQUES" value={NO_DATA} />
        <StatCard label="CTR MÉDIO" value={NO_DATA} accent />
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

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
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
