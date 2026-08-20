'use client';

import { Label } from '@live-show/design-system';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import { formatCentsToBRL, reaisToCents } from '../../utils/format-currency';
import styles from './ReviewStep.module.scss';

const FORMAT_LABELS: Record<string, string> = {
  HORIZONTAL_728x90: 'Horizontal (728×90)',
  VERTICAL_300x600: 'Vertical (300×600)',
  WIDE_16_9: 'Tela ampla 16:9 (1920×1080)',
};

const AGE_BRACKET_LABELS: Record<string, string> = {
  AGE_18_24: '18–24',
  AGE_25_34: '25–34',
  AGE_35_44: '35–44',
  AGE_45_54: '45–54',
  AGE_55_PLUS: '55+',
};

function formatDateTime(value: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

interface ReviewStepProps {
  draft: CampaignWizardDraft;
}

export function ReviewStep({ draft }: ReviewStepProps) {
  const destinationLabel =
    draft.destinationType === 'EVENT'
      ? (draft.event?.title ?? '—')
      : draft.destinationType === 'EXTERNAL_URL'
        ? draft.externalUrl
        : '—';

  return (
    <div className={styles.step}>
      <Row label="Título" value={draft.title || '—'} />
      <Row label="Formato" value={draft.format ? FORMAT_LABELS[draft.format] : '—'} />
      <Row label="Banner" value={draft.bannerFile ? draft.bannerFile.name : 'Nenhum banner enviado'} />
      <Row label="Destino" value={draft.destinationType === 'EVENT' ? `Evento: ${destinationLabel}` : destinationLabel} />
      <Row label="Interesses" value={draft.targetDomains.length > 0 ? draft.targetDomains.join(', ') : '—'} />
      <Row label="Categorias" value={draft.targetCategories.length > 0 ? draft.targetCategories.join(', ') : '—'} />
      <Row
        label="Faixa etária"
        value={
          draft.targetAgeBrackets.length > 0
            ? draft.targetAgeBrackets.map((b) => AGE_BRACKET_LABELS[b] ?? b).join(', ')
            : 'Todas as idades'
        }
      />
      <Row label="Modelo de cobrança" value={draft.billingModel ?? '—'} />
      <Row
        label="Lance"
        value={`${formatCentsToBRL(reaisToCents(draft.bidReais))} / ${draft.billingModel === 'CPC' ? 'clique' : '1k impressões'}`}
      />
      <Row label="Orçamento diário" value={formatCentsToBRL(reaisToCents(draft.dailyBudgetReais))} />
      <Row label="Limite total" value={formatCentsToBRL(reaisToCents(draft.totalLimitReais))} />
      <Row
        label="Frequência máxima"
        value={
          draft.frequencyCapMax
            ? `${draft.frequencyCapMax}× ${draft.frequencyCapWindow === 'total' ? 'no total' : 'por dia'}`
            : 'Sem limite'
        }
      />
      <Row label="Início" value={formatDateTime(draft.startsAt)} />
      <Row label="Fim" value={formatDateTime(draft.endsAt)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.row}>
      <Label className={styles.label}>{label}</Label>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
