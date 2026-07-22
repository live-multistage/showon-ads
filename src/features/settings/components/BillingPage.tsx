'use client';

import styles from './BillingPage.module.scss';

// Billing surface from the design. Payment is NOT implemented on the backend
// (spend is accounting-only today), so this is an explicit placeholder rather
// than a fake card-on-file — no data is collected or shown as real.
export function BillingPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Faturamento</h1>

      <section className={styles.card}>
        <div className={styles.badge}>EM BREVE</div>
        <h2 className={styles.cardTitle}>Pagamento ainda não disponível</h2>
        <p className={styles.text}>
          Hoje o investimento das campanhas é apenas contabilizado (não há cobrança real).
          Métodos de pagamento, faturas e recibos entram quando o faturamento for habilitado.
        </p>

        <div className={styles.placeholderRow}>
          <div className={styles.cardChip} />
          <div>
            <div className={styles.cardNumber}>•••• •••• •••• ••••</div>
            <div className={styles.cardMeta}>Nenhum método cadastrado</div>
          </div>
        </div>
      </section>
    </div>
  );
}
