'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Chip, Skeleton } from '@live-show/design-system';
import { Banner } from '@/shared/components/Banner';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import { normalizeError } from '@/shared/api/client';
import { formatCentsToBRL } from '@/features/campaigns/utils/format-currency';
import {
  useCreateTopUpMutation,
  useAdvertiserSettingsQuery,
  useWalletQuery,
  useWalletTransactionsQuery,
} from '../queries/use-wallet';
import { topUpPresets, validateTopUp } from '../utils/topup';
import { deriveTopUpConfirmation, type TopUpConfirmation } from '../utils/topup-status';
import styles from './BillingPage.module.scss';

const DEFAULT_AMOUNT_CENTS = 20000;
const POLL_INTERVAL_MS = 2000;

type CheckoutReturn = 'paid' | 'cancelled' | null;

const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

export function BillingPage() {
  const { activeAccountId } = useActiveAdvertiserAccount();
  const accountId = activeAccountId ?? undefined;
  const wallet = useWalletQuery(accountId);
  const transactions = useWalletTransactionsQuery(accountId);
  const topUp = useCreateTopUpMutation(accountId);
  const settings = useAdvertiserSettingsQuery();
  const minCents = settings.data?.minTopupCents ?? null;
  const presets = minCents === null ? [] : topUpPresets(minCents);
  const [amount, setAmount] = useState(centsToInput(DEFAULT_AMOUNT_CENTS));
  const [checkoutReturn, setCheckoutReturn] = useState<CheckoutReturn>(null);
  const [returnedAtMs, setReturnedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const router = useRouter();
  const searchParams = useSearchParams();

  // Stripe Checkout volta com ?topup=success&session_id=... ou
  // ?topup=cancelled. Limpa os parâmetros para um refresh não repetir o aviso.
  useEffect(() => {
    const result = searchParams.get('topup');
    if (result !== 'success' && result !== 'cancelled') return;

    if (result === 'success') {
      setCheckoutReturn('paid');
      setReturnedAtMs(Date.now());
    } else {
      setCheckoutReturn('cancelled');
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete('topup');
    params.delete('session_id');
    const query = params.toString();
    router.replace(query ? `/billing?${query}` : '/billing');
  }, [searchParams, router]);

  const confirmation =
    returnedAtMs === null
      ? null
      : deriveTopUpConfirmation({ returnedAtMs, nowMs, transactions: transactions.data ?? [] });

  // Não há recarga pendente no backend: refaz a leitura a cada 2s (até 30s)
  // esperando o crédito do webhook aparecer.
  const { refetch: refetchWallet } = wallet;
  const { refetch: refetchTransactions } = transactions;
  useEffect(() => {
    if (confirmation !== 'confirming') return;
    const timer = setInterval(() => {
      setNowMs(Date.now());
      void refetchWallet();
      void refetchTransactions();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [confirmation, refetchWallet, refetchTransactions]);

  const validation = minCents === null ? ({ ok: false, reason: 'invalid' } as const) : validateTopUp(amount, minCents);
  const amountError =
    minCents === null || validation.ok
      ? null
      : validation.reason === 'belowMin'
        ? `O valor mínimo de recarga é ${formatCentsToBRL(minCents)}.`
        : 'Informe um valor válido.';

  const handleTopUp = () => {
    if (!validation.ok) return;
    topUp.mutate(validation.cents, { onError: (error) => toast.error(normalizeError(error).message) });
  };

  const confirming = confirmation === 'confirming';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Carteira</h1>
      <p className={styles.lead}>Créditos pré-pagos. Impressões e cliques são descontados daqui.</p>

      {wallet.isError ? (
        <section className={styles.card} role="alert">
          <h2 className={styles.cardTitle}>Não foi possível carregar a carteira.</h2>
          <p className={styles.text}>Seu saldo não mudou. Tente de novo em alguns segundos.</p>
          <Button variant="outline" onClick={() => wallet.refetch()}>
            Tentar de novo
          </Button>
        </section>
      ) : (
        <>
          <WalletNotice
            checkoutReturn={checkoutReturn}
            confirmation={confirmation}
            balanceCents={wallet.data?.balanceCents}
            lowBalance={wallet.data?.lowBalance ?? false}
            onRetry={handleTopUp}
          />

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Saldo disponível</h2>
            {wallet.isLoading ? (
              <Skeleton className={styles.balanceSkeleton} />
            ) : (
              <p className={styles.balance}>{formatCentsToBRL(wallet.data?.balanceCents ?? 0)}</p>
            )}

            <h2 className={styles.cardTitle}>Adicionar créditos</h2>
            <div className={styles.presets}>
              {presets.map((cents) => (
                <Chip
                  key={cents}
                  variant={amount === centsToInput(cents) ? 'active' : 'default'}
                  onClick={() => setAmount(centsToInput(cents))}
                >
                  {formatCentsToBRL(cents)}
                </Chip>
              ))}
            </div>
            <label className={styles.money}>
              <span>R$</span>
              <input
                className={styles.amountInput}
                inputMode="decimal"
                aria-label="Valor da recarga"
                aria-invalid={amountError !== null}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <p className={amountError ? styles.fieldError : styles.hint}>
              {amountError ?? (minCents === null ? '' : `Mínimo de ${formatCentsToBRL(minCents)}.`)}
            </p>

            <h2 className={styles.cardTitle}>Pagamento</h2>
            <p className={styles.payMethod}>
              <b>Cartão de crédito</b>
              <small>Crédito na hora. Pagamento seguro pela Stripe.</small>
            </p>
            <Button disabled={!validation.ok || topUp.isPending || confirming} onClick={handleTopUp}>
              {confirming
                ? 'Confirmando…'
                : validation.ok
                  ? `Pagar ${formatCentsToBRL(validation.cents)} com cartão`
                  : 'Pagar com cartão'}
            </Button>
          </section>
        </>
      )}

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
                {t.amountCents < 0 ? `- ${formatCentsToBRL(Math.abs(t.amountCents))}` : formatCentsToBRL(t.amountCents)}
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

interface NoticeProps {
  checkoutReturn: CheckoutReturn;
  confirmation: TopUpConfirmation | null;
  balanceCents: number | undefined;
  lowBalance: boolean;
  onRetry: () => void;
}

// Um aviso por vez, do mais específico (resultado do pagamento) ao saldo.
function WalletNotice({ checkoutReturn, confirmation, balanceCents, lowBalance, onRetry }: NoticeProps) {
  if (confirmation === 'confirming') {
    return (
      <Banner tone="info" title="Confirmando o pagamento…">
        Pode levar alguns segundos. O saldo atualiza sozinho.
      </Banner>
    );
  }
  if (confirmation === 'delayed') {
    return (
      <Banner tone="info" title="Ainda confirmando o pagamento.">
        A confirmação pode levar alguns minutos. Seu saldo atualiza sozinho quando ela chegar.
      </Banner>
    );
  }
  if (checkoutReturn === 'paid') {
    return (
      <Banner tone="ok" title="Recarga confirmada.">
        As campanhas paradas por falta de saldo já voltaram a ser exibidas.
      </Banner>
    );
  }
  if (checkoutReturn === 'cancelled') {
    return (
      <Banner
        tone="warn"
        title="Pagamento não concluído."
        action={
          <Button size="sm" variant="outline" onClick={onRetry}>
            Tentar de novo
          </Button>
        }
      >
        Nenhum valor foi cobrado e seu saldo continua o mesmo.
      </Banner>
    );
  }
  if (balanceCents !== undefined && balanceCents <= 0) {
    return (
      <Banner tone="err" title="Saldo zerado.">
        Nenhuma campanha está sendo exibida até você adicionar créditos.
      </Banner>
    );
  }
  if (lowBalance) {
    return (
      <Banner tone="warn" title="Saldo baixo.">
        Suas campanhas param de ser exibidas quando o saldo zera.
      </Banner>
    );
  }
  return null;
}
