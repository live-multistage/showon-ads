'use client';

import { Logo } from '@live-show/design-system';
import styles from './AdsMarketingPanel.module.scss';

const FEATURES = [
  'Campanhas de evento ou link externo',
  'Segmentação por domínio e categoria',
  'Métricas de impressão, clique e investimento',
];

// Brand/marketing panel for the auth screens — mirrors the main live-show
// login's split layout, re-skinned for the Ads Manager sub-brand (the "ADS"
// badge beside the LIVESHOW wordmark).
export function AdsMarketingPanel() {
  return (
    <div className={styles.panel}>
      <div className={styles.glowPink} />
      <div className={styles.glowPurple} />

      <div className={styles.content}>
        <div className={styles.logoRow}>
          <Logo size={20} wordmarkClassName={styles.logoWordmark} />
          <span className={styles.badge}>ADS</span>
        </div>

        <div className={styles.body}>
          <p className={styles.eyebrow}>PLATAFORMA DE ANÚNCIOS</p>
          <h1 className={styles.title}>Anuncie onde o público está ao vivo.</h1>
          <p className={styles.desc}>
            Crie e gerencie campanhas na plataforma live-show — de eventos a
            criativos externos — em um só lugar.
          </p>

          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature} className={styles.feature}>
                <span className={styles.featureDot} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
