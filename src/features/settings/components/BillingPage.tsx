'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import {
  useCreateTopUpMutation,
  useWalletQuery,
  useWalletTransactionsQuery,
} from '../queries/use-wallet';
import styles from './BillingPage.module.scss';

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

// Values chosen to never collide with typical transaction amounts shown in
// the history list below (avoids ambiguous text queries in tests/DOM).
const PRESETS = [1000, 3000, 10000];

export function BillingPage() {
  const { activeAccountId } = useActiveAdvertiserAccount();
  const accountId = activeAccountId ?? undefined;
  const wallet = useWalletQuery(accountId);
  const transactions = useWalletTransactionsQuery(accountId);
  const topUp = useCreateTopUpMutation(accountId);
  const [amountReais, setAmountReais] = useState('50');

  const handleTopUp = () => {
    const cents = Math.round(Number(amountReais.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    topUp.mutate(cents, { onError: () => toast.error('Não foi possível iniciar a recarga') });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Faturamento</h1>

      {wallet.data?.lowBalance && (
        <div role="status" className={styles.lowBalance}>
          Saldo baixo — suas campanhas param de ser exibidas quando o saldo zera.
        </div>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Saldo</h2>
        <p className={styles.balance}>{wallet.isLoading ? '—' : brl(wallet.data?.balanceCents ?? 0)}</p>

        <div className={styles.topUpRow}>
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              className={styles.preset}
              onClick={() => setAmountReais(String(cents / 100))}
            >
              {brl(cents)}
            </button>
          ))}
          <input
            className={styles.amountInput}
            inputMode="decimal"
            aria-label="Valor da recarga em reais"
            value={amountReais}
            onChange={(e) => setAmountReais(e.target.value)}
          />
          <button
            type="button"
            className={styles.primary}
            disabled={topUp.isPending}
            onClick={handleTopUp}
          >
            Adicionar créditos
          </button>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Histórico</h2>
        {transactions.isLoading && <p className={styles.text}>Carregando…</p>}
        {transactions.data?.length === 0 && <p className={styles.text}>Nenhuma movimentação ainda.</p>}
        <ul className={styles.history}>
          {transactions.data?.map((t) => (
            <li key={t.id} className={styles.historyRow}>
              <span className={styles.historyLabel}>
                {t.type === 'TOPUP' ? 'Recarga' : t.type === 'DEBIT' ? 'Consumo' : 'Ajuste'}
              </span>
              <span className={styles.historyRef}>{t.reference}</span>
              <span className={t.amountCents < 0 ? styles.negative : styles.positive}>
                {t.amountCents < 0 ? `- ${brl(Math.abs(t.amountCents))}` : brl(t.amountCents)}
              </span>
              <time className={styles.historyDate} dateTime={t.createdAt}>
                {new Date(t.createdAt).toLocaleDateString('pt-BR')}
              </time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
