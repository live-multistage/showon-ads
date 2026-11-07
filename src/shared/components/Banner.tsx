import styles from './Banner.module.scss';

export type BannerTone = 'ok' | 'warn' | 'err' | 'info';

interface Props {
  tone: BannerTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}

// Aviso de faixa cheia usado nas telas de carteira e lista de campanhas.
export function Banner({ tone, title, children, action }: Props) {
  return (
    <div role="status" className={`${styles.banner} ${styles[tone]}`}>
      <div className={styles.body}>
        <b className={styles.title}>{title}</b>
        {children && <span className={styles.text}>{children}</span>}
      </div>
      {action}
    </div>
  );
}
