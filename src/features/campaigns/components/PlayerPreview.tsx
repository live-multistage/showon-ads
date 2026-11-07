'use client';

import { useState } from 'react';
import type { AdPauseVariant } from '@/features/advertisements/types/advertisement.types';
import styles from './PlayerPreview.module.scss';

type Mode = 'live' | 'replay';

interface Props {
  kind: 'preroll' | 'pause';
  pauseVariant: AdPauseVariant | null;
  title: string;
  // URL local do criativo já escolhido (imagem da pausa ou vídeo).
  creativeUrl: string | null;
}

const PLACEHOLDER_TITLE = 'Título da campanha';

const NOTE = {
  preroll:
    'O título da campanha vira o botão de ação sobre o vídeo. O contador e o "Pular anúncio" são da showon. Toca com som; se o navegador bloquear, toca mudo com "Ativar som".',
  pauseStandard: 'A transmissão encolhe para o card à esquerda. Título e botões ficam à direita.',
  pauseFullscreen: 'A transmissão some. Ficam só os controles da live ou do replay.',
  mobile: 'No celular a pausa é sempre Tela cheia, qualquer que seja a variante escolhida.',
} as const;

// Prévia do criativo dentro do player. A transmissão aqui é ilustrativa.
export function PlayerPreview({ kind, pauseVariant, title, creativeUrl }: Props) {
  const [mode, setMode] = useState<Mode>('live');
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [afterFive, setAfterFive] = useState(false);
  const [phone, setPhone] = useState(false);

  const fullscreen = kind === 'pause' && (pauseVariant === 'FULLSCREEN' || phone);
  const text = title.trim() || PLACEHOLDER_TITLE;

  return (
    <div>
      <div className={styles.toolbar}>
        <Toggle on={mode === 'live'} onClick={() => setMode('live')}>
          Ao vivo
        </Toggle>
        <Toggle on={mode === 'replay'} onClick={() => setMode('replay')}>
          Replay
        </Toggle>
        {kind === 'preroll' && (
          <Toggle on={afterFive} onClick={() => setAfterFive((v) => !v)}>
            Depois de 5 s
          </Toggle>
        )}
        {kind === 'pause' && (
          <Toggle on={phone} onClick={() => setPhone((v) => !v)}>
            Celular
          </Toggle>
        )}
        <Toggle on={showSafeArea} onClick={() => setShowSafeArea((v) => !v)}>
          Área segura
        </Toggle>
      </div>

      {kind === 'preroll' ? (
        <div className={styles.player} role="img" aria-label="Prévia: vídeo antes da transmissão">
          {creativeUrl ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- prévia local para o anunciante
            <video className={styles.video} src={creativeUrl} muted />
          ) : (
            <div className={styles.video} />
          )}
          <span className={styles.badge}>Patrocinado · {afterFive ? '14' : '19'} s</span>
          <span className={styles.mute}>Ativar som</span>
          <span className={styles.cta}>{text} →</span>
          <span className={`${styles.skip} ${afterFive ? styles.skipReady : ''}`}>
            {afterFive ? 'Pular anúncio' : 'Pular em 4'}
          </span>
          {showSafeArea && (
            <>
              <span className={`${styles.safe} ${styles.safePreTop}`} />
              <span className={`${styles.safe} ${styles.safePreBottom}`} />
            </>
          )}
        </div>
      ) : (
        <div className={styles.player} role="img" aria-label={`Prévia: anúncio na pausa, variante ${fullscreen ? 'Tela cheia' : 'Padrão'}`}>
          {creativeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local (object URL)
            <img className={styles.bgImage} src={creativeUrl} alt="" />
          ) : (
            <div className={styles.bg} />
          )}
          <span className={styles.tag}>Patrocinado</span>
          <div className={styles.copy}>
            <span className={styles.title}>{text}</span>
            <span className={styles.acts}>
              <span className={`${styles.pill} ${styles.pillPrimary}`}>Saiba mais →</span>
              <span className={styles.pill}>Fechar anúncio</span>
            </span>
          </div>
          {!fullscreen && (
            <div className={styles.card}>
              <span className={styles.paused} aria-hidden>
                ▶
              </span>
              <span className={`${styles.liveBadge} ${styles.liveBadgeSmall}`}>{mode === 'live' ? 'AO VIVO' : 'REPLAY'}</span>
            </div>
          )}
          <div className={styles.controls}>
            <span>▶</span>
            {mode === 'live' ? <span>AO VIVO · -0:11</span> : <span>1:02:14 / 2:10:00</span>}
            <span className={styles.controlsGrow} />
            <span>Auto</span>
          </div>
          {showSafeArea &&
            (fullscreen ? (
              <span className={`${styles.safe} ${styles.safeControls}`}>
                <b>CONTROLES</b>
              </span>
            ) : (
              <>
                <span className={`${styles.safe} ${styles.safeCard}`}>
                  <b>CARD DO VÍDEO</b>
                </span>
                <span className={`${styles.safe} ${styles.safeControls}`}>
                  <b>CONTROLES</b>
                </span>
              </>
            ))}
        </div>
      )}

      <p className={styles.note}>
        {kind === 'preroll' ? NOTE.preroll : phone ? NOTE.mobile : fullscreen ? NOTE.pauseFullscreen : NOTE.pauseStandard}
      </p>
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} className={`${styles.toggle} ${on ? styles.toggleOn : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
