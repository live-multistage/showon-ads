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
      <div className={styles.backLinkRow}>
        <Link href="/">← Campanhas</Link>
      </div>

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
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);
const METRIC_ICON: Record<string, React.ReactNode> = {
  impressions: metricSvg(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  clicks: metricSvg(<><path d="M9 9l5 12 1.8-5.2L21 14 9 9z" /><path d="M7.2 2.2 8 5M5.9 4.6 4 6.5M2.2 7.2 5 8" /></>),
  ctr: metricSvg(<><path d="M3 17l5-5 4 4 8-9" /><path d="M14 7h6v6" /></>),
  spend: metricSvg(<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
};

// KpiCard-style metric (mirrors live-show-react's KpiCard): mono icon+label,
// big Space Mono number, magenta glow + pink number on the accent (CTR).
function Metric({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${styles.metricCard} ${accent ? styles.metricCardAccent : ''}`}>
      {accent && <div className={styles.metricGlow} />}
      <div className={styles.metricLabel}>
        <span className={styles.metricIcon}>{METRIC_ICON[icon]}</span>
        {label}
      </div>
      <div className={`${styles.metricNum} ${accent ? styles.metricNumPink : ''}`}>{value}</div>
    </div>
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
