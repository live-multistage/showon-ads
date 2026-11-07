'use client';

import { Banner } from '@/shared/components/Banner';
import { PAUSE_VARIANT_NAME, type CampaignWizardDraft, type WizardStepId } from '../../hooks/use-campaign-wizard';
import { formatCostPerImpression } from '../../utils/brl';
import { PLACEMENT_LABEL } from '../../utils/ad-display';
import { formatCentsToBRL, reaisToCents } from '../../utils/format-currency';
import { StepHeader } from './StepHeader';
import styles from './ReviewStep.module.scss';

const FORMAT_LABELS: Record<string, string> = {
  HORIZONTAL_728x90: 'Banner Horizontal 728×90',
  VERTICAL_300x600: 'Banner Vertical 300×600',
  WIDE_16_9: 'Anúncio na pausa',
  VIDEO_16_9: 'Vídeo antes da transmissão',
};

const AGE_BRACKET_LABELS: Record<string, string> = {
  AGE_18_24: '18–24',
  AGE_25_34: '25–34',
  AGE_35_44: '35–44',
  AGE_45_54: '45–54',
  AGE_55_PLUS: '55+',
};

const MS_PER_DAY = 86_400_000;

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '—';
}

function periodLabel(startsAt: string, endsAt: string): string {
  if (!startsAt || !endsAt) return '—';
  const days = Math.max(1, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / MS_PER_DAY));
  return `${formatDate(startsAt)} – ${formatDate(endsAt)} · ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function typeLabel(draft: CampaignWizardDraft): string {
  const base = draft.format ? FORMAT_LABELS[draft.format] : '—';
  if (draft.kind !== 'pause' || !draft.pauseVariant) return base;
  const mobile = draft.pauseVariant === 'STANDARD' ? ' (Tela cheia no celular)' : '';
  return `${base} · ${PAUSE_VARIANT_NAME[draft.pauseVariant]}${mobile}`;
}

function positionsLabel(draft: CampaignWizardDraft): string {
  if (draft.kind === 'preroll') return 'Antes do vídeo · lives e replays';
  if (draft.kind === 'pause') return 'Pausa no player · lives e replays';
  return draft.placements.map((p) => PLACEMENT_LABEL[p]).join(', ') || '—';
}

function billingLabel(draft: CampaignWizardDraft): string {
  const cents = reaisToCents(draft.bidReais);
  if (draft.billingModel === 'CPC') return `${formatCentsToBRL(cents)} por clique`;
  if (draft.billingModel === 'CPM') return `${formatCentsToBRL(cents)} por mil ${draft.kind === 'pause' ? 'exibições' : 'impressões'}`;
  return '—';
}

interface ReviewStepProps {
  draft: CampaignWizardDraft;
  // null = saldo ainda não carregou: não afirma nada sobre cobertura.
  balanceCents: number | null;
  onEdit: (step: WizardStepId) => void;
  submitFailed?: boolean;
}

export function ReviewStep({ draft, balanceCents, onEdit, submitFailed = false }: ReviewStepProps) {
  const destinationLabel =
    draft.destinationType === 'EVENT' ? (draft.event?.title ?? '—') : draft.destinationType === 'EXTERNAL_URL' ? draft.externalUrl : '—';
  const dailyCents = reaisToCents(draft.dailyBudgetReais);

  return (
    <div className={styles.step}>
      <StepHeader step={4} title="Revisão" lead="Confira antes de enviar. A análise costuma sair no mesmo dia útil." />

      {submitFailed && (
        <Banner tone="err" title="Não foi possível enviar a campanha.">
          Ela ficou salva como rascunho. Suas escolhas continuam aqui.
        </Banner>
      )}
      <WalletNotice balanceCents={balanceCents} dailyCents={dailyCents} />

      <Group title="Criativo e destino" onEdit={() => onEdit('creative')}>
        <Row label="Tipo" value={typeLabel(draft)} />
        <Row label="Título" value={draft.title || '—'} />
        <Row label="Arquivo" value={draft.bannerFile ? draft.bannerFile.name : 'Nenhum arquivo enviado'} />
        <Row label="Leva para" value={destinationLabel} />
      </Group>

      <Group title="Onde e para quem" onEdit={() => onEdit('targeting')}>
        <Row label="Posições" value={positionsLabel(draft)} />
        <Row label="Interesses" value={draft.targetDomains.length > 0 ? draft.targetDomains.join(', ') : 'Todos'} />
        <Row label="Categorias" value={draft.targetCategories.length > 0 ? draft.targetCategories.join(', ') : '—'} />
        <Row
          label="Idade"
          value={
            draft.targetAgeBrackets.length > 0
              ? draft.targetAgeBrackets.map((b) => AGE_BRACKET_LABELS[b] ?? b).join(', ')
              : 'Todas as idades'
          }
        />
        <Row
          label="Limite por pessoa"
          value={draft.frequencyCapMax ? `${draft.frequencyCapMax} ${draft.frequencyCapWindow === 'total' ? 'no total' : 'por dia'}` : 'Sem limite'}
        />
      </Group>

      <Group title="Orçamento e período" onEdit={() => onEdit('budget')}>
        <Row label="Cobrança" value={billingLabel(draft)} />
        {draft.billingModel === 'CPM' && (
          <Row label="Cada impressão" value={formatCostPerImpression(reaisToCents(draft.bidReais))} />
        )}
        <Row label="Por dia" value={formatCentsToBRL(dailyCents)} />
        <Row label="Limite total" value={formatCentsToBRL(reaisToCents(draft.totalLimitReais))} />
        <Row label="Período" value={periodLabel(draft.startsAt, draft.endsAt)} />
      </Group>
    </div>
  );
}

function WalletNotice({ balanceCents, dailyCents }: { balanceCents: number | null; dailyCents: number }) {
  if (balanceCents === null) return null;
  if (balanceCents <= 0) {
    return (
      <Banner tone="warn" title="Sua carteira está sem saldo.">
        Você pode enviar para análise agora. Se for aprovada, a campanha só começa a aparecer depois que você adicionar
        créditos.
      </Banner>
    );
  }
  const days = dailyCents > 0 ? Math.floor(balanceCents / dailyCents) : null;
  return (
    <Banner tone="ok" title={`Saldo de ${formatCentsToBRL(balanceCents)} na carteira.`}>
      {days === null
        ? null
        : days < 1
          ? `Cobre menos de um dia do orçamento diário de ${formatCentsToBRL(dailyCents)}.`
          : `Cobre cerca de ${days} ${days === 1 ? 'dia' : 'dias'} do orçamento diário de ${formatCentsToBRL(dailyCents)}.`}
    </Banner>
  );
}

function Group({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className={styles.group}>
      <div className={styles.groupHead}>
        <b className={styles.groupTitle}>{title}</b>
        <button type="button" className={styles.editBtn} onClick={onEdit} aria-label={`Editar ${title}`}>
          Editar
        </button>
      </div>
      <div className={styles.rows}>{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
