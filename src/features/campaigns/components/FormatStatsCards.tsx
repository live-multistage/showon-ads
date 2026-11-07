import type { AdReportResponse } from '@/features/advertisements/types/advertisement.types';
import styles from './FormatStatsCards.module.scss';

// Percentual sobre as impressões; sem impressões não há base: "—", nunca divisão por zero.
export function pctOf(count: number, impressions: number): string {
  if (impressions <= 0) return '—';
  return `${Math.round((count / impressions) * 100)}%`;
}

function Share({ label, count, impressions }: { label: string; count: number; impressions: number }) {
  return (
    <li className={styles.row}>
      <span>{label}</span>
      <progress className={styles.bar} max={Math.max(impressions, 1)} value={Math.min(count, impressions)} aria-label={label} />
      <span className={styles.value}>
        {pctOf(count, impressions)}
        <span className={styles.count}>{count.toLocaleString('pt-BR')}</span>
      </span>
    </li>
  );
}

function Summary({ label, count, impressions }: { label: string; count: number; impressions: number }) {
  return (
    <div className={styles.summaryRow}>
      <dt>{label}</dt>
      <dd>
        {pctOf(count, impressions)} · {count.toLocaleString('pt-BR')}
      </dd>
    </div>
  );
}

// Retenção de pre-roll: quantas reproduções passaram de cada quartil.
export function VideoRetentionCard({ report }: { report: AdReportResponse }) {
  const { video, impressions } = report;
  return (
    <section className={styles.card} aria-label="Retenção do vídeo">
      <h2 className={styles.title}>RETENÇÃO DO VÍDEO</h2>
      <ul className={styles.rows}>
        <Share label="25%" count={video.q25} impressions={impressions} />
        <Share label="50%" count={video.q50} impressions={impressions} />
        <Share label="75%" count={video.q75} impressions={impressions} />
        <Share label="Até o fim" count={video.complete} impressions={impressions} />
      </ul>
      <dl className={styles.summary}>
        <Summary label="Pularam" count={video.skip} impressions={impressions} />
        <Summary label="Ativaram o som" count={video.unmute} impressions={impressions} />
      </dl>
    </section>
  );
}

export function PauseStatsCard({ report }: { report: AdReportResponse }) {
  return (
    <section className={styles.card} aria-label="Na pausa">
      <h2 className={styles.title}>NA PAUSA</h2>
      <dl className={styles.summary}>
        <Summary label="Fecharam o anúncio" count={report.pause.closed} impressions={report.impressions} />
      </dl>
    </section>
  );
}
