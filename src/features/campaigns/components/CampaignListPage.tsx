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
import { Banner } from '@/shared/components/Banner';
import { useWalletQuery } from '@/features/settings/queries/use-wallet';
import { useListAdsQuery } from '@/features/advertisements/queries/use-list-ads';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import type { AdResponse, AdStatus } from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, STATUS_BADGE_VARIANT, FORMAT_LABEL, FORMAT_SHORT, CAMPAIGN_KIND_LABEL, campaignKindBadge, campaignKindOf, destinationLabel, gradientFor, type CampaignKind } from '../utils/ad-display';
import { deriveDelivery, deliveryLabel, needsAction, DELIVERY_DISPLAY, type Delivery } from '../utils/derive-delivery';
import styles from './CampaignListPage.module.scss';

const NO_DATA = '—';
const PAGE_SIZE = 5;

type TabKey = 'ALL' | 'ACTIVE' | 'REVIEW' | 'FIX' | 'PAUSED' | 'ENDED' | 'DRAFTS';
type KindFilter = 'ALL' | CampaignKind;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'ACTIVE', label: 'Ativas' },
  { key: 'REVIEW', label: 'Em análise' },
  { key: 'FIX', label: 'Precisam de ajuste' },
  { key: 'PAUSED', label: 'Pausadas' },
  { key: 'ENDED', label: 'Encerradas' },
  { key: 'DRAFTS', label: 'Rascunhos' },
];

const KIND_FILTERS: { key: KindFilter; label: string }[] = [
  { key: 'ALL', label: 'Todos os tipos' },
  { key: 'banner', label: CAMPAIGN_KIND_LABEL.banner },
  { key: 'preroll', label: CAMPAIGN_KIND_LABEL.preroll },
  { key: 'pause', label: CAMPAIGN_KIND_LABEL.pause },
];

// Rejeitadas têm aba própria ("Precisam de ajuste"): é onde o anunciante age.
function matchesTab(tab: TabKey, status: AdStatus): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'FIX') return status === 'REJECTED';
  if (tab === 'DRAFTS') return status === 'DRAFT';
  return status === tab;
}

function formatPeriod(startsAt: string, endsAt: string): string {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

export function CampaignListPage() {
  const { data: ads = [], isLoading: isAdsLoading, isError: isAdsError, refetch: refetchAds } = useListAdsQuery();
  const { accounts, activeAccountId, setActiveAccountId, isLoading: isAccountsLoading } =
    useActiveAdvertiserAccount();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [kindFilter, setKindFilter] = useState<KindFilter>('ALL');
  const [page, setPage] = useState(1);
  const wallet = useWalletQuery(activeAccountId ?? undefined);
  const balanceCents = wallet.data?.balanceCents ?? null;

  const isLoading = isAdsLoading || isAccountsLoading || (accounts.length > 0 && activeAccountId === null);

  const campaigns = useMemo(
    () => (activeAccountId ? ads.filter((ad) => ad.advertiserAccountId === activeAccountId) : []),
    [ads, activeAccountId],
  );

  // `metrics.spentTodayCents` (gasto do dia) vem do backend quando disponível;
  // sem ele a lista não afirma "orçamento do dia atingido".
  const deliveries = useMemo(() => {
    const now = new Date();
    return new Map<string, Delivery>(
      campaigns.map((c) => [
        c.id,
        deriveDelivery(c, { now, walletBalanceCents: balanceCents, spentTodayCents: c.metrics?.spentTodayCents ?? null }),
      ]),
    );
  }, [campaigns, balanceCents]);

  const totals = useMemo(
    () =>
      campaigns.reduce(
        (acc, c) => ({
          impressions: acc.impressions + (c.metrics?.impressions ?? 0),
          clicks: acc.clicks + (c.metrics?.clicks ?? 0),
          spendCents: acc.spendCents + (c.metrics?.spendCents ?? 0),
          spentTodayCents: acc.spentTodayCents + (c.metrics?.spentTodayCents ?? 0),
          hasSpentToday: acc.hasSpentToday || c.metrics?.spentTodayCents !== undefined,
        }),
        { impressions: 0, clicks: 0, spendCents: 0, spentTodayCents: 0, hasSpentToday: false },
      ),
    [campaigns],
  );
  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : null;

  const actionCounts = useMemo(() => {
    let rejected = 0;
    let noVideo = 0;
    for (const c of campaigns) {
      const d = deliveries.get(c.id);
      if (d === 'rejected') rejected += 1;
      if (d === 'novideo') noVideo += 1;
    }
    return { rejected, noVideo };
  }, [campaigns, deliveries]);
  const actionTotal = campaigns.filter((c) => needsAction(deliveries.get(c.id)!)).length;

  const tabFiltered = useMemo(
    () =>
      campaigns.filter(
        (c) => matchesTab(activeTab, c.status) && (kindFilter === 'ALL' || campaignKindOf(c.format) === kindFilter),
      ),
    [campaigns, activeTab, kindFilter],
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

      {isAdsError ? null : (
        <>
          <WalletStrip balanceCents={balanceCents} spentTodayCents={totals.hasSpentToday ? totals.spentTodayCents : null} />
          <BalanceBanner
            balanceCents={balanceCents}
            lowBalance={wallet.data?.lowBalance ?? false}
            activeCount={campaigns.filter((c) => c.status === 'ACTIVE').length}
          />
          <section className={styles.stats}>
            <StatCard icon="impressions" label="IMPRESSÕES · TOTAL" value={isLoading ? NO_DATA : totals.impressions.toLocaleString('pt-BR')} />
            <StatCard
              icon="clicks"
              label="CLIQUES · TOTAL"
              value={isLoading ? NO_DATA : totals.clicks.toLocaleString('pt-BR')}
              hint={avgCtr === null ? undefined : `CTR médio ${avgCtr.toFixed(2).replace('.', ',')}%`}
            />
            <StatCard icon="campaigns" label="GASTO · TOTAL" value={isLoading ? NO_DATA : formatCentsToBRL(totals.spendCents)} />
            <StatCard
              icon="ctr"
              label="PRECISAM DE AÇÃO"
              value={isLoading ? NO_DATA : String(actionTotal)}
              hint={isLoading ? undefined : actionHint(actionCounts)}
              accent={actionTotal > 0}
            />
          </section>
        </>
      )}

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

      <div className={styles.kindFilters} role="group" aria-label="Filtrar por tipo">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={kindFilter === f.key}
            className={`${styles.kindChip} ${kindFilter === f.key ? styles.kindChipActive : ''}`}
            onClick={() => {
              setKindFilter(f.key);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isAdsError && (
        <div className={styles.empty} role="alert">
          <p className={styles.emptyTitle}>Não foi possível carregar suas campanhas.</p>
          <p className={styles.emptyText}>Verifique a conexão e tente de novo. Suas campanhas continuam no ar normalmente.</p>
          <button type="button" className={styles.newBtn} onClick={() => refetchAds()}>
            Tentar de novo
          </button>
        </div>
      )}

      {isLoading && (
        <div className={styles.skeletonList} aria-label="Carregando campanhas">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {!isLoading && !isAdsError && campaigns.length === 0 && (
        <FirstSteps funded={balanceCents !== null && balanceCents > 0} balanceCents={balanceCents} />
      )}

      {!isLoading && !isAdsError && campaigns.length > 0 && (
        <>
          <div className={styles.table} role="table" aria-label="Campanhas">
            <div className={styles.tableHead} role="row">
              <span role="columnheader">CAMPANHA</span>
              <span role="columnheader">STATUS</span>
              <span role="columnheader">ENTREGA</span>
              <span role="columnheader" className={styles.num}>IMPRESSÕES</span>
              <span role="columnheader" className={styles.num}>CLIQUES</span>
              <span role="columnheader" className={styles.num}>CTR</span>
              <span role="columnheader">GASTO / LIMITE</span>
            </div>
            {paged.map((ad) => (
              <CampaignRow key={ad.id} ad={ad} delivery={deliveries.get(ad.id)!} />
            ))}
            {filtered.length === 0 && (
              <div className={styles.noMatch}>
                {query ? 'Nenhuma campanha corresponde à busca.' : 'Nenhuma campanha com esse filtro.'}
              </div>
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

function StatCard({ icon, label, value, accent, hint }: { icon: string; label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCardAccent : ''}`}>
      {accent && <div className={styles.statGlow} />}
      <div className={styles.statLabel}>
        <span className={styles.statIcon}>{STAT_ICON[icon]}</span>
        {label}
      </div>
      <div className={`${styles.statValue} ${accent ? styles.statValueAccent : ''}`}>{value}</div>
      {hint && <div className={styles.statHint}>{hint}</div>}
    </div>
  );
}

function CampaignRow({ ad, delivery }: { ad: AdResponse; delivery: Delivery }) {
  const { tone } = DELIVERY_DISPLAY[delivery];
  const pct = ad.totalLimitCents > 0 ? Math.min(100, Math.round((ad.totalSpendCents / ad.totalLimitCents) * 100)) : 0;
  const thumbBg = ad.bannerUrl ? `url(${ad.bannerUrl}) center/cover no-repeat` : gradientFor(ad.id);

  return (
    <Link href={`/campaigns/${ad.id}`} className={styles.row} role="row" aria-label={`Abrir ${ad.title}`}>
      <div className={styles.adCell}>
        <div className={styles.thumb} style={{ background: thumbBg }}>
          <span className={styles.thumbFormat}>{FORMAT_SHORT[ad.format]}</span>
        </div>
        <div className={styles.info}>
          <div className={styles.cellTitle}>{ad.title}</div>
          <div className={styles.infoMeta}>
            <span>{campaignKindBadge(ad)}</span>
            <span>{formatPeriod(ad.startsAt, ad.endsAt)}</span>
            <span className={ad.destination ? undefined : styles.cellHint}>{destinationLabel(ad.destination)}</span>
          </div>
        </div>
      </div>

      <div>
        <Badge variant={STATUS_BADGE_VARIANT[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>
      </div>

      <div className={`${styles.delivery} ${styles[`delivery_${tone}`]}`}>
        <span className={styles.deliveryDot} aria-hidden />
        {deliveryLabel(delivery, ad.startsAt)}
      </div>

      <span className={`${styles.num} ${styles.hideSmall}`}>{(ad.metrics?.impressions ?? 0).toLocaleString('pt-BR')}</span>
      <span className={`${styles.num} ${styles.hideSmall}`}>{(ad.metrics?.clicks ?? 0).toLocaleString('pt-BR')}</span>
      <span className={`${styles.num} ${styles.hideSmall}`}>
        {ad.metrics?.ctr != null ? `${ad.metrics.ctr.toFixed(2)}%` : NO_DATA}
      </span>

      <div className={styles.budget}>
        <span className={styles.budgetText}>
          {formatCentsToBRL(ad.totalSpendCents)} / {formatCentsToBRL(ad.totalLimitCents)}
        </span>
        <div className={styles.budgetTrack}>
          <div className={`${styles.budgetFill} ${pct >= 80 ? styles.budgetFillWarn : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

function actionHint({ rejected, noVideo }: { rejected: number; noVideo: number }): string | undefined {
  const parts = [
    rejected > 0 ? `${rejected} ${rejected === 1 ? 'rejeitada' : 'rejeitadas'}` : null,
    noVideo > 0 ? `${noVideo} sem vídeo` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function WalletStrip({ balanceCents, spentTodayCents }: { balanceCents: number | null; spentTodayCents: number | null }) {
  const empty = balanceCents !== null && balanceCents <= 0;
  return (
    <div className={styles.walletStrip}>
      <div>
        <div className={styles.statLabel}>SALDO DA CARTEIRA</div>
        <div className={`${styles.walletValue} ${empty ? styles.walletValueLow : ''}`}>
          {balanceCents === null ? NO_DATA : formatCentsToBRL(balanceCents)}
        </div>
      </div>
      {spentTodayCents !== null && (
        <div>
          <div className={styles.statLabel}>GASTO HOJE</div>
          <div className={styles.walletValueSmall}>{formatCentsToBRL(spentTodayCents)}</div>
        </div>
      )}
      <p className={styles.walletHint}>
        {empty
          ? 'Sem saldo, nenhuma campanha é exibida. O saldo novo vale na hora.'
          : 'Cada impressão ou clique é descontado deste saldo. Se ele acabar, as campanhas param de ser exibidas.'}
      </p>
      <Link href="/billing" className={empty ? styles.newBtn : styles.secondaryBtn}>
        Adicionar créditos
      </Link>
    </div>
  );
}

function BalanceBanner({ balanceCents, lowBalance, activeCount }: { balanceCents: number | null; lowBalance: boolean; activeCount: number }) {
  const action = (
    <Link href="/billing" className={styles.secondaryBtn}>
      Adicionar créditos
    </Link>
  );
  if (balanceCents !== null && balanceCents <= 0) {
    return (
      <Banner tone="err" title="Seu saldo acabou. Nenhuma campanha está sendo exibida." action={action}>
        {activeCount > 0
          ? `${activeCount} ${activeCount === 1 ? 'campanha ativa parou' : 'campanhas ativas pararam'}. Adicione créditos e elas voltam na hora, sem nova análise.`
          : 'Adicione créditos para suas campanhas voltarem a ser exibidas.'}
      </Banner>
    );
  }
  if (lowBalance) {
    return (
      <Banner tone="warn" title="Saldo baixo." action={action}>
        Suas campanhas param de ser exibidas quando o saldo zerar.
      </Banner>
    );
  }
  return null;
}

function FirstSteps({ funded, balanceCents }: { funded: boolean; balanceCents: number | null }) {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>Sua primeira campanha em três passos</p>
      <p className={styles.emptyText}>
        Divulgue seu evento, show, conferência, jogo ou curso para quem já assiste na showon: no feed, antes da
        transmissão ou na pausa do player.
      </p>
      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.stepNumber}>{funded ? '✓ FEITO' : 'PASSO 1'}</span>
          <b>Adicione créditos</b>
          <span>
            {funded && balanceCents !== null
              ? `Saldo de ${formatCentsToBRL(balanceCents)} pronto para usar.`
              : 'Pagamento por cartão.'}
          </span>
          {!funded && (
            <Link href="/billing" className={styles.secondaryBtn}>
              Adicionar créditos
            </Link>
          )}
        </li>
        <li className={styles.step}>
          <span className={styles.stepNumber}>PASSO 2</span>
          <b>Monte a campanha</b>
          <span>Banner, vídeo ou pausa; onde aparece, para quem e quanto pagar.</span>
          <Link href="/campaigns/new" className={styles.newBtn}>
            <PlusIcon />
            Criar primeira campanha
          </Link>
        </li>
        <li className={styles.step}>
          <span className={styles.stepNumber}>PASSO 3</span>
          <b>Análise da equipe</b>
          <span>Revisamos cada criativo antes de ir ao ar. Você é avisado do resultado.</span>
        </li>
      </ol>
    </div>
  );
}
