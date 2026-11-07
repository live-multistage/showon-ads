'use client';

import { useState, type ChangeEvent } from 'react';
import type { AdFormat, AdPauseVariant } from '@/features/advertisements/types/advertisement.types';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import type { CampaignKind } from '../../utils/ad-display';
import { readMediaFacts, validateFileBasics, validateMedia } from '../../utils/validate-creative-file';
import styles from './CreativeStep.module.scss';

const TITLE_MAX = 80;

const KIND_CARDS: { kind: CampaignKind; name: string; desc: string; spec: string }[] = [
  {
    kind: 'banner',
    name: 'Banner nas páginas',
    desc: 'Feed, página do evento, checkout e pós-compra.',
    spec: 'PNG, JPG ou WEBP · até 2 MB · 728×90 ou 300×600',
  },
  {
    kind: 'preroll',
    name: 'Vídeo antes da transmissão',
    desc: 'Toca antes de a live ou o replay começar. Pode ser pulado após 5 s.',
    spec: 'MP4 · 16:9 · 1 a 30 s · até 50 MB',
  },
  {
    kind: 'pause',
    name: 'Anúncio na pausa',
    desc: 'Aparece quando a pessoa pausa a live ou o replay por 2 s.',
    spec: 'PNG ou JPG · 16:9 · mínimo 1280×720 · até 2 MB',
  },
];

const BANNER_SIZES: { value: AdFormat; label: string }[] = [
  { value: 'HORIZONTAL_728x90', label: 'Horizontal 728×90' },
  { value: 'VERTICAL_300x600', label: 'Vertical 300×600' },
];

const PAUSE_VARIANTS: { value: AdPauseVariant; name: string; desc: string; safe: string }[] = [
  {
    value: 'STANDARD',
    name: 'Padrão',
    desc: 'A transmissão encolhe para um card à esquerda e o seu criativo ocupa o fundo. Quem pausou continua vendo o evento.',
    safe: 'ÁREA SEGURA: METADE DIREITA',
  },
  {
    value: 'FULLSCREEN',
    name: 'Tela cheia',
    desc: 'O criativo ocupa a tela toda e a imagem da transmissão some. Ficam só os controles da live ou do replay.',
    safe: 'ÁREA SEGURA: TUDO ACIMA DOS CONTROLES',
  },
];

const TITLE_HINT: Record<CampaignKind, string> = {
  banner: 'Só você vê. Aparece no Ads Manager e nos relatórios.',
  preroll: 'O público vê: vira o botão de ação sobre o vídeo.',
  pause: 'O público vê: é o título grande ao lado do player.',
};

const IDEAL_DIM: Record<AdFormat, string> = {
  HORIZONTAL_728x90: '728×90',
  VERTICAL_300x600: '300×600',
  WIDE_16_9: '1920×1080',
  VIDEO_16_9: '1920×1080',
};

interface CreativeStepProps {
  draft: CampaignWizardDraft;
  updateDraft: (patch: Partial<CampaignWizardDraft>) => void;
  selectKind: (kind: CampaignKind) => void;
  setBanner: (file: File | null) => void;
  // Editing an existing campaign: its type cannot change (it would change
  // placements and the file), only its content.
  lockKind?: boolean;
}

export function CreativeStep({ draft, updateDraft, selectKind, setBanner, lockKind = false }: CreativeStepProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const kind = draft.kind;

  // Tipo e tamanho barram na hora. As medidas (e a duração do vídeo) só dá
  // para ler depois de abrir o arquivo: ele entra no rascunho de imediato e
  // sai de lá se a medida não servir.
  function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0] ?? null;
    if (!file) {
      setFileError(null);
      setBanner(null);
      return;
    }
    const format = draft.format;
    if (!format) return;

    const basicsError = validateFileBasics(format, file);
    if (basicsError) {
      setFileError(basicsError);
      input.value = '';
      return;
    }
    setFileError(null);
    setBanner(file);

    void readMediaFacts(file, format).then((facts) => {
      const mediaError = facts ? validateMedia(format, facts) : null;
      if (!mediaError) return;
      setFileError(mediaError);
      setBanner(null);
      input.value = '';
    });
  }

  const idealDim = draft.format ? IDEAL_DIM[draft.format] : '728×90';
  const isVideo = kind === 'preroll';

  return (
    <div className={styles.step}>
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowText}>PASSO 1 DE 4</span>
      </div>
      <h2 className={styles.heading}>Criativo e destino</h2>
      <p className={styles.lead}>Que tipo de anúncio, o arquivo e para onde a pessoa vai ao clicar.</p>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>TIPO DE ANÚNCIO</span>
        </div>
        <div className={styles.kindGrid} role="group" aria-label="Tipo de anúncio">
          {KIND_CARDS.map((card) => (
            <button
              key={card.kind}
              type="button"
              aria-pressed={kind === card.kind}
              disabled={lockKind && kind !== card.kind}
              className={`${styles.formatCard} ${kind === card.kind ? styles.formatCardSelected : ''}`}
              onClick={() => selectKind(card.kind)}
            >
              <span className={styles.formatTitle}>{card.name}</span>
              <span className={styles.formatDims}>{card.desc}</span>
              <span className={styles.formatPlacement}>{card.spec}</span>
            </button>
          ))}
        </div>
      </div>

      {kind === 'banner' && (
        <div className={styles.field}>
          <span className={styles.label}>TAMANHO</span>
          <div className={styles.segment} role="group" aria-label="Tamanho do banner">
            {BANNER_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                aria-pressed={draft.format === size.value}
                className={`${styles.segmentBtn} ${draft.format === size.value ? styles.segmentBtnOn : ''}`}
                onClick={() => updateDraft({ format: size.value })}
              >
                {size.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>Os dois cabem nas quatro posições de página. O vertical ocupa a coluna inteira.</p>
        </div>
      )}

      {kind === 'preroll' && (
        <p className={styles.notice}>
          O vídeo toca como foi enviado, sem conversão. Para carregar rápido em celular, prefira 1080p com até 20 MB.
        </p>
      )}

      {kind === 'pause' && (
        <>
          <div className={styles.field}>
            <span className={styles.label}>VARIANTE</span>
            <div className={styles.kindGrid} role="group" aria-label="Variante da pausa">
              {PAUSE_VARIANTS.map((variant) => (
                <button
                  key={variant.value}
                  type="button"
                  aria-pressed={draft.pauseVariant === variant.value}
                  className={`${styles.formatCard} ${draft.pauseVariant === variant.value ? styles.formatCardSelected : ''}`}
                  onClick={() => updateDraft({ pauseVariant: variant.value })}
                >
                  <span className={styles.formatTitle}>{variant.name}</span>
                  <span className={styles.formatDims}>{variant.desc}</span>
                  <span className={styles.formatPlacement}>{variant.safe}</span>
                </button>
              ))}
            </div>
          </div>
          <p className={styles.notice}>
            <b>No celular, a pausa é sempre Tela cheia.</b> O card da Padrão fica pequeno demais na tela do celular.
            Prepare o criativo para as duas áreas seguras. Tela cheia tem lance mínimo maior; os valores aparecem no
            passo 3.
          </p>
        </>
      )}

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label} id="campaign-title-label">
            TÍTULO
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
        <p className={styles.hint}>{TITLE_HINT[kind]}</p>
      </div>

      {/* banner */}
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{isVideo ? 'VÍDEO' : 'IMAGEM'}</span>
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
