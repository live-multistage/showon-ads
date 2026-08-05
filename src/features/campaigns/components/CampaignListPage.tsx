'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  SimpleCustomSelect,
  type SelectOption,
} from '@live-show/design-system';

function PlusIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

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
import type { AdResponse, AdStatus } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, STATUS_BADGE_VARIANT, FORMAT_LABEL, FORMAT_SHORT, destinationLabel, gradientFor } from '../utils/ad-display';
import styles from './CampaignListPage.module.scss';

const NO_DATA = '—';
const PAGE_SIZE = 5;

type TabKey = 'ALL' | 'ACTIVE' | 'REVIEW' | 'PAUSED' | 'ENDED' | 'DRAFTS';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'ACTIVE', label: 'Ativas' },
  { key: 'REVIEW', label: 'Em análise' },
  { key: 'PAUSED', label: 'Pausadas' },
  { key: 'ENDED', label: 'Encerradas' },
  { key: 'DRAFTS', label: 'Rascunhos' },
];

// DRAFT and REJECTED are both "not yet running, advertiser can still edit"
// states — grouped under one Rascunhos tab rather than a near-empty tab each.
function matchesTab(tab: TabKey, status: AdStatus): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'DRAFTS') return status === 'DRAFT' || status === 'REJECTED';
  return status === tab;
}

function formatPeriod(startsAt: string, endsAt: string): string {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

export function CampaignListPage() {
  const { data: ads = [], isLoading: isAdsLoading } = useListAdsQuery();
  const { accounts, activeAccountId, setActiveAccountId, isLoading: isAccountsLoading } =
    useActiveAdvertiserAccount();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [page, setPage] = useState(1);

  const isLoading = isAdsLoading || isAccountsLoading || (accounts.length > 0 && activeAccountId === null);

  const campaigns = useMemo(
    () => (activeAccountId ? ads.filter((ad) => ad.advertiserAccountId === activeAccountId) : []),
    [ads, activeAccountId],
  );

  const totals = useMemo(
    () =>
      campaigns.reduce(
        (acc, c) => ({
          impressions: acc.impressions + (c.metrics?.impressions ?? 0),
          clicks: acc.clicks + (c.metrics?.clicks ?? 0),
        }),
        { impressions: 0, clicks: 0 },
      ),
    [campaigns],
  );
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null;

  const tabFiltered = useMemo(
    () => campaigns.filter((c) => matchesTab(activeTab, c.status)),
    [campaigns, activeTab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tabFiltered.filter((c) => c.title.toLowerCase().includes(q)) : tabFiltered;
  }, [tabFiltered, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

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
        <Link href="/campaigns/new" className={styles.newBtn}>
          <PlusIcon />
          Nova campanha
        </Link>
      </header>

      <section className={styles.stats}>
        <StatCard icon="campaigns" label="CAMPANHAS" value={isLoading ? NO_DATA : String(campaigns.length)} />
        <StatCard icon="impressions" label="IMPRESSÕES" value={isLoading ? NO_DATA : totals.impressions.toLocaleString('pt-BR')} />
        <StatCard icon="clicks" label="CLIQUES" value={isLoading ? NO_DATA : totals.clicks.toLocaleString('pt-BR')} />
        <StatCard
          icon="ctr"
          label="CTR MÉDIO"
          value={isLoading || avgCtr === null ? NO_DATA : `${avgCtr.toFixed(2)}%`}
          accent
        />
      </section>

      <div className={styles.tabs}>
        {TABS.map((tab) => {
          const count = campaigns.filter((c) => matchesTab(tab.key, c.status)).length;
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

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
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
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
          <Link href="/campaigns/new" className={styles.newBtn}>
            <PlusIcon />
            Criar primeira campanha
          </Link>
        </div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <>
          <div className={styles.table}>
            {paged.map((ad) => (
              <CampaignRow key={ad.id} ad={ad} />
            ))}
            {filtered.length === 0 && (
              <div className={styles.noMatch}>Nenhuma campanha corresponde à busca.</div>
            )}
          </div>

          {filtered.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                MOSTRANDO <b>{paged.length}</b> DE <b>{filtered.length}</b>
              </span>
              {totalPages > 1 && (
                <div className={styles.pageButtons}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={pageSafe <= 1}
                    onClick={() => setPage(pageSafe - 1)}
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.pageBtn} ${n === pageSafe ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={pageSafe >= totalPages}
                    onClick={() => setPage(pageSafe + 1)}
                    aria-label="Próxima página"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </>
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
  const pct = ad.totalLimitCents > 0 ? Math.min(100, Math.round((ad.totalSpendCents / ad.totalLimitCents) * 100)) : 0;
  const thumbBg = ad.bannerUrl ? `url(${ad.bannerUrl}) center/cover no-repeat` : gradientFor(ad.id);

  return (
    <Link href={`/campaigns/${ad.id}`} className={styles.row}>
      <div className={styles.thumb} style={{ background: thumbBg }}>
        <span className={styles.thumbFormat}>{FORMAT_SHORT[ad.format]}</span>
      </div>

      <div className={styles.info}>
        <div className={styles.infoTop}>
          <Badge variant={STATUS_BADGE_VARIANT[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>
          <span className={ad.destination ? styles.cellMono : styles.cellHint}>
            {destinationLabel(ad.destination)}
          </span>
        </div>
        <div className={styles.cellTitle}>{ad.title}</div>
        <div className={styles.infoMeta}>
          <span>
            <b>FMT</b> {FORMAT_LABEL[ad.format]}
          </span>
          <span>
            <b>PER</b> {formatPeriod(ad.startsAt, ad.endsAt)}
          </span>
        </div>
      </div>

      <div className={styles.metrics}>
        <RowMetric label="IMPRESS." value={(ad.metrics?.impressions ?? 0).toLocaleString('pt-BR')} />
        <RowMetric label="CLIQUES" value={(ad.metrics?.clicks ?? 0).toLocaleString('pt-BR')} />
        <RowMetric label="CTR" value={ad.metrics?.ctr != null ? `${ad.metrics.ctr.toFixed(2)}%` : NO_DATA} accent />
        <RowMetric label="GASTO" value={formatCentsToBRL(ad.metrics?.spendCents ?? 0)} accent />
      </div>

      <div className={styles.budget}>
        <span className={styles.budgetText}>
          {formatCentsToBRL(ad.totalSpendCents)} / {formatCentsToBRL(ad.totalLimitCents)}
        </span>
        <div className={styles.budgetTrack}>
          <div
            className={`${styles.budgetFill} ${pct >= 80 ? styles.budgetFillWarn : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function RowMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={styles.rowMetric}>
      <div className={styles.rowMetricLabel}>{label}</div>
      <div className={`${styles.rowMetricValue} ${accent ? styles.rowMetricAccent : ''}`}>{value}</div>
    </div>
  );
}
