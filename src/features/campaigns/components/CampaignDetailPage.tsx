'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Skeleton,
} from '@live-show/design-system';
import { useGetAdQuery } from '@/features/advertisements/queries/use-get-ad';
import { useAdReportQuery } from '@/features/advertisements/queries/use-ad-report';
import { useAdReviewsQuery } from '@/features/advertisements/queries/use-ad-reviews';
import { useChangeAdStatusMutation } from '@/features/advertisements/mutations/use-change-ad-status.mutation';
import type {
  AdDailyBreakdown,
  AdReportResponse,
  AdResponse,
  AdReviewEntry,
  AdStatus,
  AdStatusAction,
} from '@/features/advertisements/types/advertisement.types';
import { formatCentsToBRL } from '../utils/format-currency';
import { STATUS_LABEL, STATUS_BADGE_VARIANT, FORMAT_LABEL, destinationLabel } from '../utils/ad-display';
import { EditCampaignForm } from './EditCampaignForm';
import styles from './CampaignDetailPage.module.scss';

// Matches Ad#update's editable-status guard (domain/ad.ts) — ACTIVE/REVIEW/
// ENDED can never be edited.
const EDITABLE_STATUSES: AdStatus[] = ['DRAFT', 'PAUSED', 'REJECTED'];

interface StatusActionCfg {
  action: AdStatusAction;
  label: string;
  variant: 'default' | 'outline' | 'destructive';
}

// Mirrors ChangeAdStatusUseCase's transition table exactly: DRAFT/REJECTED
// only ever submit (never self-approve — that's the reviewer's call), REVIEW
// has no advertiser-facing action, ACTIVE/PAUSED can pause|activate and end.
function availableActions(status: AdStatus): StatusActionCfg[] {
  if (status === 'DRAFT') return [{ action: 'submit', label: 'Enviar para revisão', variant: 'default' }];
  if (status === 'REJECTED') return [{ action: 'submit', label: 'Reenviar para revisão', variant: 'default' }];
  if (status === 'ACTIVE') {
    return [
      { action: 'pause', label: 'Pausar', variant: 'outline' },
      { action: 'end', label: 'Encerrar', variant: 'destructive' },
    ];
  }
  if (status === 'PAUSED') {
    return [
      { action: 'activate', label: 'Reativar', variant: 'default' },
      { action: 'end', label: 'Encerrar', variant: 'destructive' },
    ];
  }
  return [];
}

// Mirrors Ad#submitForReview's own guards, so submit is disabled client-side
// instead of round-tripping to a 4xx: a legacy ad has no destination at all,
// and an EXTERNAL_URL ad needs a banner before it can go to review.
function submitBlockReason(ad: AdResponse): string | null {
  if (ad.destination === null) {
    return 'Destino obrigatório: edite a campanha e defina um destino antes de enviar para revisão.';
  }
  if (ad.destination.type === 'EXTERNAL_URL' && !ad.bannerUrl) {
    return 'Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.';
  }
  return null;
}

const OUTCOME_LABEL: Record<AdReviewEntry['outcome'], string> = {
  APPROVE: 'Aprovado',
  REJECT: 'Rejeitado',
  PENDING: 'Pendente',
  SUBMITTED: 'Enviado para análise',
};

interface CampaignDetailPageProps {
  id: string;
}

export function CampaignDetailPage({ id }: CampaignDetailPageProps) {
  const { data: ad, isLoading, isError } = useGetAdQuery(id);
  const { data: report } = useAdReportQuery(id);
  const { data: reviews } = useAdReviewsQuery(id);
  const changeStatus = useChangeAdStatusMutation();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className={styles.page} aria-label="Carregando campanha">
        <Skeleton style={{ height: '2rem', width: '16rem' }} />
        <Skeleton style={{ height: '8rem' }} />
        <Skeleton style={{ height: '8rem' }} />
      </div>
    );
  }

  if (isError || !ad) {
    return (
      <div className={styles.centered}>
        <p>Anúncio não encontrado.</p>
        <Link href="/" className={styles.backLink}>
          Voltar para campanhas
        </Link>
      </div>
    );
  }

  const canEdit = EDITABLE_STATUSES.includes(ad.status);
  const actions = availableActions(ad.status);
  const rejectionReason = reviews?.find((r) => r.outcome === 'REJECT')?.reason ?? null;
  const blockReason = submitBlockReason(ad);
  // Reviews come back oldest-first from the API; show the most recent first.
  const timeline = reviews ? [...reviews].reverse() : [];

  if (editing) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Editar campanha</h1>
        </header>
        <EditCampaignForm ad={ad} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          CAMPANHAS
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbActive}>{ad.title.toUpperCase()}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{ad.title}</h1>
          <Badge variant={STATUS_BADGE_VARIANT[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>
        </div>
        <p className={styles.meta}>
          {FORMAT_LABEL[ad.format]} · {destinationLabel(ad.destination)}
        </p>
        {canEdit && (
          <div className={styles.editRow}>
            <Button variant="outline" onClick={() => setEditing(true)}>
              Editar
            </Button>
          </div>
        )}
      </header>

      {ad.status === 'REJECTED' && (
        <Card className={styles.rejectCard}>
          <CardContent className={styles.rejectBody} role="alert">
            <strong>Anúncio rejeitado na análise.</strong>
            <p className={styles.rejectReason}>{rejectionReason ?? 'Sem motivo detalhado.'}</p>
            <div>
              <Button onClick={() => setEditing(true)}>Editar e reenviar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Métricas</h2>
        <div className={styles.metricsGrid}>
          <Metric icon="impressions" label="IMPRESSÕES" value={report ? report.impressions.toLocaleString('pt-BR') : '—'} />
          <Metric icon="clicks" label="CLIQUES" value={report ? report.clicks.toLocaleString('pt-BR') : '—'} />
          <Metric icon="ctr" label="CTR" value={report?.ctr != null ? `${(report.ctr * 100).toFixed(2)}%` : '—'} accent />
          <Metric icon="spend" label="GASTO" value={report ? formatCentsToBRL(report.spendCents) : '—'} />
        </div>
      </section>

      {report && report.dailyBreakdown.length > 1 && (
        <section className={styles.chartCard}>
          <div className={styles.chartHead}>
            <span className={styles.chartTitle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff5fb4" strokeWidth="2" aria-hidden>
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
              DESEMPENHO AO LONGO DO TEMPO
            </span>
            <span className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendLineImp} /> Impressões
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendLineClk} /> Cliques
              </span>
            </span>
          </div>
          <PerformanceChart points={report.dailyBreakdown} />
        </section>
      )}

      <div className={styles.splitRow}>
        <CreativeCard ad={ad} />
        <BudgetCard ad={ad} report={report} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de revisões</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className={styles.empty}>Nenhuma revisão registrada ainda.</p>
          ) : (
            <ul className={styles.timeline}>
              {timeline.map((entry) => (
                <li key={entry.id} className={styles.timelineEntry}>
                  <div className={styles.timelineHead}>
                    <strong>{OUTCOME_LABEL[entry.outcome]}</strong>
                    <span className={styles.timelineDate}>
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {entry.reason && <p className={styles.timelineReason}>{entry.reason}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className={styles.actions}>
            <div className={styles.actionButtons}>
              {actions.map((cfg) =>
                cfg.action === 'end' ? (
                  <EndActionButton
                    key={cfg.action}
                    disabled={changeStatus.isPending}
                    onConfirm={() => changeStatus.mutate({ adId: ad.id, action: 'end' })}
                  />
                ) : (
                  <Button
                    key={cfg.action}
                    variant={cfg.variant}
                    disabled={changeStatus.isPending || (cfg.action === 'submit' && !!blockReason)}
                    onClick={() => changeStatus.mutate({ adId: ad.id, action: cfg.action })}
                  >
                    {cfg.label}
                  </Button>
                ),
              )}
            </div>
            {blockReason && actions.some((a) => a.action === 'submit') && (
              <p className={styles.warning} role="alert">
                {blockReason}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const metricSvg = (path: React.ReactNode) => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);
const METRIC_ICON: Record<string, React.ReactNode> = {
  impressions: metricSvg(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  clicks: metricSvg(<><path d="M9 9l5 12 1.8-5.2L21 14 9 9z" /><path d="M7.2 2.2 8 5M5.9 4.6 4 6.5M2.2 7.2 5 8" /></>),
  ctr: metricSvg(<><path d="M3 17l5-5 4 4 8-9" /><path d="M14 7h6v6" /></>),
  spend: metricSvg(<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
};
// Per-metric tile tint (Liveshow Relatorio Anuncio.dc.html KPI icon squares).
const METRIC_TINT: Record<string, string> = {
  impressions: styles.tintImpressions,
  clicks: styles.tintClicks,
  ctr: styles.tintCtr,
  spend: styles.tintSpend,
};

// KpiCard-style metric (mirrors live-show-react's KpiCard): colored icon tile,
// mono label, big Space Mono number, magenta glow + pink number on CTR.
function Metric({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${styles.metricCard} ${accent ? styles.metricCardAccent : ''}`}>
      {accent && <div className={styles.metricGlow} />}
      <div className={`${styles.metricTile} ${METRIC_TINT[icon]}`}>{METRIC_ICON[icon]}</div>
      <div className={styles.metricLabel}>{label}</div>
      <div className={`${styles.metricNum} ${accent ? styles.metricNumPink : ''}`}>{value}</div>
    </div>
  );
}

// ── Performance chart ─────────────────────────────────
// Real series from the report's dailyBreakdown: impressions (magenta area) and
// clicks (dashed violet). Each series is scaled to its own max over a 700×240
// viewBox that stretches to the card width.
const CHART_W = 700;
const CHART_TOP = 16;
const CHART_BOT = 210;

function scaleSeries(vals: number[]): { x: number; y: number }[] {
  const max = Math.max(1, ...vals);
  const n = vals.length;
  return vals.map((v, i) => ({
    x: n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W,
    y: CHART_TOP + (1 - v / max) * (CHART_BOT - CHART_TOP),
  }));
}
const toLine = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

function PerformanceChart({ points }: { points: AdDailyBreakdown[] }) {
  const impPts = scaleSeries(points.map((p) => p.impressions));
  const clkPts = scaleSeries(points.map((p) => p.clicks));
  const area = `${toLine(impPts)} L${CHART_W},240 L0,240 Z`;

  // Show at most ~8 evenly-spaced day labels so the axis never crowds.
  const step = Math.max(1, Math.ceil(points.length / 8));
  const labels = points.filter((_, i) => i % step === 0);
  const dayFmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit' });

  return (
    <div className={styles.chartBody}>
      <svg viewBox={`0 0 ${CHART_W} 240`} preserveAspectRatio="none" className={styles.chartSvg}>
        <defs>
          <linearGradient id="adReportArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff2e9e" stopOpacity=".35" />
            <stop offset="100%" stopColor="#ff2e9e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="rgba(255,255,255,.05)">
          <line x1="0" y1="48" x2={CHART_W} y2="48" />
          <line x1="0" y1="96" x2={CHART_W} y2="96" />
          <line x1="0" y1="144" x2={CHART_W} y2="144" />
          <line x1="0" y1="192" x2={CHART_W} y2="192" />
        </g>
        <path d={area} fill="url(#adReportArea)" />
        <path d={toLine(impPts)} fill="none" stroke="#ff2e9e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={toLine(clkPts)} fill="none" stroke="#bba6ff" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" />
      </svg>
      <div className={styles.chartAxis}>
        {labels.map((p) => (
          <span key={p.date}>{dayFmt(p.date)}</span>
        ))}
      </div>
    </div>
  );
}

// ── Creative preview ──────────────────────────────────
function CreativeCard({ ad }: { ad: AdResponse }) {
  const fileName = ad.bannerUrl ? ad.bannerUrl.split('/').pop() : null;
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff5fb4" strokeWidth="2" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        CRIATIVO
      </div>
      <div className={styles.creativePreview}>
        {ad.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.bannerUrl} alt={ad.title} className={styles.creativeImg} />
        ) : (
          <span className={styles.creativeName}>{ad.title.toUpperCase()}</span>
        )}
      </div>
      <dl className={styles.specList}>
        <div className={styles.specRow}>
          <dt>FORMATO</dt>
          <dd>{FORMAT_LABEL[ad.format]}</dd>
        </div>
        <div className={styles.specRow}>
          <dt>DESTINO</dt>
          <dd>{destinationLabel(ad.destination)}</dd>
        </div>
        <div className={styles.specRow}>
          <dt>ARQUIVO</dt>
          <dd>{fileName ?? '—'}</dd>
        </div>
      </dl>
    </section>
  );
}

// ── Budget tracker ────────────────────────────────────
// spend / limit gauge + daily-average, all derived from real ad totals. Daily
// average = spend ÷ days the campaign has been live so far.
function BudgetCard({ ad, report }: { ad: AdResponse; report?: AdReportResponse }) {
  const spent = ad.totalSpendCents;
  const limit = ad.totalLimitCents;
  const remaining = Math.max(0, limit - spent);
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  const start = new Date(ad.startsAt).getTime();
  const now = Math.min(Date.now(), new Date(ad.endsAt).getTime());
  const daysLive = Math.max(1, Math.ceil((now - start) / 86_400_000));
  const dailyAvg = report ? Math.round(report.spendCents / daysLive) : Math.round(spent / daysLive);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff5fb4" strokeWidth="2" aria-hidden>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        ORÇAMENTO
      </div>
      <div className={styles.gaugeWrap}>
        <svg viewBox="0 0 42 42" className={styles.gauge}>
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="5" />
          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke="#ff2e9e"
            strokeWidth="5"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.gaugeCenter}>
          <span className={styles.gaugePct}>{pct}%</span>
          <span className={styles.gaugeLabel}>UTILIZADO</span>
        </div>
      </div>
      <dl className={styles.specList}>
        <div className={styles.specRow}>
          <dt>GASTO</dt>
          <dd className={styles.specPink}>{formatCentsToBRL(spent)}</dd>
        </div>
        <div className={styles.specRow}>
          <dt>LIMITE</dt>
          <dd>{formatCentsToBRL(limit)}</dd>
        </div>
        <div className={styles.specRow}>
          <dt>DIÁRIO MÉD.</dt>
          <dd>{formatCentsToBRL(dailyAvg)}</dd>
        </div>
        <div className={styles.specRow}>
          <dt>RESTAM</dt>
          <dd className={styles.specGreen}>{formatCentsToBRL(remaining)}</dd>
        </div>
      </dl>
    </section>
  );
}

// 'end' is irreversible (Ad#end has no un-end transition), so it's the only
// status action gated behind a confirm dialog.
function EndActionButton({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={disabled}>
          Encerrar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encerrar campanha?</DialogTitle>
          <DialogDescription>
            Essa ação não pode ser desfeita. A campanha deixará de veicular permanentemente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Encerrar campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
