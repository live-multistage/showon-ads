'use client';

import { Logo } from '@live-show/design-system';
import styles from './AdsMarketingPanel.module.scss';

const FEATURES = [
  'Campanhas de evento ou link externo',
  'Segmentação por domínio e categoria',
  'Métricas de impressão, clique e investimento',
];

// Brand/marketing panel for the auth screens (login + signup), re-skinned for
// the Ads Manager sub-brand (the "ADS" badge beside the showon.io wordmark).
export function AdsMarketingPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.glowPink} />
      <div className={styles.glowPurple} />
      <div className={styles.scanlines} />

      <div className={styles.logoRow}>
        <Logo size={24} showWordmark={false} />
        <span className={styles.wordmark}>
          show<span className={styles.accent}>on</span>.io
        </span>
        <span className={styles.badge}>ADS</span>
      </div>

      <div className={styles.body}>
        <p className={styles.eyebrow}>PLATAFORMA DE ANÚNCIOS</p>
        <h1 className={styles.title}>
          Anuncie onde o público está <span className={styles.accent}>ao vivo.</span>
        </h1>
        <p className={styles.desc}>
          Crie e gerencie campanhas na plataforma live-show — de eventos a criativos externos — em
          um só lugar.
        </p>

        <ul className={styles.features}>
          {FEATURES.map((feature) => (
            <li key={feature} className={styles.feature}>
              <span className={styles.check} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
