'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import type { AdFormat } from '@/features/advertisements/types/advertisement.types';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import { acceptedFormatsFor } from '../../utils/ad-display';
import styles from './CreativeStep.module.scss';

const TITLE_MAX = 80;

// Mirrors the backend's video upload limit (Task 4) — rejecting the file
// client-side avoids a full upload just to get the server's 400.
const MAX_VIDEO_BYTES = 52_428_800;

// The backend AdFormat enum defines these four. Which ones render as cards
// depends on the placements picked in the Targeting step — see
// PLACEMENT_ACCEPTED_FORMATS / acceptedFormatsFor below. The mock's
// "Quadrado 300×300" card has no server-side format, so it's intentionally
// omitted rather than shown as an unsubmittable option.
const FORMATS: {
  value: AdFormat;
  label: string;
  dims: string;
  placement: string;
  variant: 'horizontal' | 'vertical' | 'wide';
}[] = [
  { value: 'HORIZONTAL_728x90', label: 'Horizontal', dims: '728 × 90', placement: 'FEED · TOPO', variant: 'horizontal' },
  { value: 'VERTICAL_300x600', label: 'Vertical', dims: '300 × 600', placement: 'SIDEBAR', variant: 'vertical' },
  {
    value: 'WIDE_16_9',
    label: 'Tela ampla 16:9',
    dims: 'mín. 1280×720, ideal 1920×1080',
    placement: 'PAUSA DO PLAYER',
    variant: 'wide',
  },
  {
    value: 'VIDEO_16_9',
    label: 'Vídeo 16:9',
    dims: 'ideal 1920×1080',
    placement: 'PRE-ROLL',
    variant: 'wide',
  },
];

const IDEAL_DIM: Record<AdFormat, string> = {
  HORIZONTAL_728x90: '728×90',
  VERTICAL_300x600: '300×600',
  WIDE_16_9: '1920×1080',
  VIDEO_16_9: '1920×1080',
};

interface CreativeStepProps {
  draft: CampaignWizardDraft;
  updateDraft: (patch: Partial<CampaignWizardDraft>) => void;
  setBanner: (file: File | null) => void;
}

export function CreativeStep({ draft, updateDraft, setBanner }: CreativeStepProps) {
  const acceptedFormats = acceptedFormatsFor(draft.placements);
  const visibleFormats = FORMATS.filter((format) => acceptedFormats.includes(format.value));
  const [fileError, setFileError] = useState<string | null>(null);

  // Going back to Targeting and changing placements can make the
  // previously-picked format invalid (e.g. adding PLAYER_PAUSE to a page
  // placement, or vice-versa) — reset it so the step revalidates instead of
  // silently carrying a format that no longer fits every selected placement.
  useEffect(() => {
    // A momentarily-empty placement selection is its own validation error
    // ("Selecione pelo menos um posicionamento.") — don't pile a format reset
    // on top of it while the advertiser is mid-edit on Targeting.
    if (draft.placements.length === 0) return;
    if (draft.format && !acceptedFormats.includes(draft.format)) {
      updateDraft({ format: null });
      setBanner(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateDraft/setBanner are not stable across renders
  }, [draft.format, draft.placements.length, acceptedFormats.join(',')]);

  function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && draft.format === 'VIDEO_16_9' && file.size > MAX_VIDEO_BYTES) {
      setFileError('O vídeo deve ter no máximo 50MB.');
      event.target.value = '';
      return;
    }
    setFileError(null);
    setBanner(file);
  }

  const idealDim = draft.format ? IDEAL_DIM[draft.format] : '728×90';
  const isVideo = draft.format === 'VIDEO_16_9';

  return (
    <div className={styles.step}>
      {/* eyebrow */}
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowIcon} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M3 10h18" />
          </svg>
        </span>
        <span className={styles.eyebrowText}>PASSO 1 DE 5</span>
      </div>
      <h2 className={styles.heading}>Criativo</h2>
      <p className={styles.lead}>Defina o título da campanha, escolha um formato e faça o upload do banner.</p>

      {/* title */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label} id="campaign-title-label">
            TÍTULO DA CAMPANHA
          </span>
          <span className={styles.counter}>
            {draft.title.length} / {TITLE_MAX}
          </span>
        </div>
        <input
          type="text"
          aria-label="Título"
          aria-labelledby="campaign-title-label"
          className={styles.input}
          value={draft.title}
          maxLength={TITLE_MAX}
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="Ex: Festival Jazz na Praça — Banner Topo"
        />
        <p className={styles.hint}>
          Aparece no seu Ads Manager e nos relatórios — não é exibido para o público.
        </p>
      </div>

      {/* format */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>FORMATO DO BANNER</span>
          <span className={styles.labelMeta}>SELECIONE UM</span>
        </div>
        <div className={styles.formatGrid}>
          {visibleFormats.map((format) => {
            const selected = draft.format === format.value;
            return (
              <button
                key={format.value}
                type="button"
                aria-label={`${format.label} (${format.dims.replace(/\s/g, '')})`}
                aria-pressed={selected}
                className={`${styles.formatCard} ${selected ? styles.formatCardSelected : ''}`}
                onClick={() => updateDraft({ format: format.value })}
              >
                {selected && (
                  <span className={styles.formatCheck} aria-hidden>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                )}
                <span className={styles.formatSwatchWrap}>
                  <span className={`${styles.formatSwatch} ${styles[`swatch_${format.variant}`]}`} />
                </span>
                <span className={styles.formatTitle}>{format.label}</span>
                <span className={styles.formatDims}>{format.dims}</span>
                <span className={styles.formatPlacement}>{format.placement}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* banner */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>UPLOAD DO BANNER</span>
          <span className={styles.labelOk}>DIMENSÃO IDEAL: {idealDim}</span>
        </div>

        <label className={styles.dropzone}>
          <input
            type="file"
            accept={isVideo ? 'video/mp4' : 'image/png,image/jpeg,image/webp'}
            aria-label="Banner"
            className={styles.fileInput}
            onChange={handleBannerChange}
          />
          {draft.bannerPreviewUrl ? (
            <span className={styles.dropzoneFilled}>
              {isVideo ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption -- staged local preview, not shown to viewers
                <video src={draft.bannerPreviewUrl} className={styles.dropzonePreview} controls muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- object URL preview, not a static asset
                <img src={draft.bannerPreviewUrl} alt="Pré-visualização do banner" className={styles.dropzonePreview} />
              )}
              <span className={styles.dropzoneReplace}>{isVideo ? 'Trocar vídeo' : 'Trocar imagem'}</span>
            </span>
          ) : (
            <span className={styles.dropzoneEmpty}>
              <span className={styles.dropzoneIcon} aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 16V4M6 10l6-6 6 6" />
                  <path d="M4 20h16" />
                </svg>
              </span>
              <span className={styles.dropzoneTitle}>
                {isVideo ? (
                  <>Arraste seu vídeo ou <span className={styles.dropzoneLink}>clique para selecionar</span></>
                ) : (
                  <>Arraste sua imagem ou <span className={styles.dropzoneLink}>clique para selecionar</span></>
                )}
              </span>
              <span className={styles.dropzoneMeta}>
                {isVideo ? 'MP4 · MÁX 50MB · ATÉ 30s' : `PNG · JPG · WEBP · MÁX 2MB · MÍNIMO ${idealDim}`}
              </span>
            </span>
          )}
        </label>
        {fileError && (
          <p className={styles.fileError} role="alert">
            {fileError}
          </p>
        )}

        <div className={styles.pills}>
          <span className={`${styles.pill} ${styles.pillViolet}`}>Áreas de segurança 20px</span>
          <span className={`${styles.pill} ${styles.pillCyan}`}>Exporte em 2× para retina</span>
          <span className={`${styles.pill} ${styles.pillAmber}`}>Evite texto pequeno</span>
        </div>
      </div>
    </div>
  );
}
