'use client';

import type { AdFormat } from '@/features/advertisements/types/advertisement.types';
import type { CampaignWizardDraft } from '../hooks/use-campaign-wizard';
import styles from './CampaignPreviewPanel.module.scss';

const FORMAT_META: Record<AdFormat, { label: string; ratio: string; dims: string }> = {
  HORIZONTAL_728x90: { label: 'Horizontal', ratio: '728 / 90', dims: '728×90' },
  VERTICAL_300x600: { label: 'Vertical', ratio: '300 / 600', dims: '300×600' },
  WIDE_16_9: { label: 'Tela ampla 16:9', ratio: '16 / 9', dims: '1920×1080' },
};

interface CampaignPreviewPanelProps {
  draft: CampaignWizardDraft;
}

// Side rail: live banner preview + approval tips + a reach estimate placeholder.
// The estimate is intentionally static — no reach-estimation endpoint exists;
// showing "—" is honest rather than a fabricated number.
export function CampaignPreviewPanel({ draft }: CampaignPreviewPanelProps) {
  const meta = draft.format ? FORMAT_META[draft.format] : FORMAT_META.HORIZONTAL_728x90;

  return (
    <aside className={styles.rail} aria-label="Pré-visualização e dicas">
      {/* preview */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>PRÉ-VISUALIZAÇÃO</span>
          <span className={styles.cardMeta}>{meta.label.toUpperCase()}</span>
        </div>
        <div className={styles.preview} style={{ aspectRatio: meta.ratio }}>
          {draft.bannerPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL preview
            <img src={draft.bannerPreviewUrl} alt="Pré-visualização do banner" className={styles.previewImg} />
          ) : (
            <>
              <span className={styles.previewHatch} aria-hidden />
              <span className={styles.previewPlaceholder}>SEU BANNER {meta.dims}</span>
            </>
          )}
        </div>
        <div className={styles.metaGrid}>
          <div>
            <div className={styles.metaLabel}>FORMATO</div>
            <div className={styles.metaValue}>{meta.label}</div>
          </div>
          <div>
            <div className={styles.metaLabel}>POSIÇÕES</div>
            <div className={styles.metaValue}>Feed · Evento</div>
          </div>
        </div>
      </div>

      {/* approval tips */}
      <div className={styles.tips}>
        <div className={styles.tipsHead}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bba6ff" strokeWidth="2" aria-hidden>
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3h6c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z" />
          </svg>
          <span className={styles.tipsTitle}>DICAS PARA APROVAÇÃO</span>
        </div>
        <ul className={styles.tipsList}>
          <li>Contraste alto entre texto e fundo</li>
          <li>Sem promessas de resultado garantido</li>
          <li>Menção obrigatória à marca do anunciante</li>
          <li>Evite CTAs enganosos (&quot;clique aqui!&quot;)</li>
        </ul>
      </div>

      {/* estimate */}
      <div className={styles.card}>
        <div className={styles.estLabel}>ESTIMATIVA (CONFIGURE PASSOS 1–2)</div>
        <div className={styles.estValue}>— –– impressões</div>
        <div className={styles.estHint}>Alcance depende de público e orçamento.</div>
      </div>
    </aside>
  );
}
