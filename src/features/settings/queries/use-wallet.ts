'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/wallet.service';

const walletKey = (accountId: string) => ['wallet', accountId] as const;
const txKey = (accountId: string) => ['wallet', accountId, 'transactions'] as const;

export function useWalletQuery(accountId: string | undefined) {
  return useQuery({
    queryKey: walletKey(accountId ?? ''),
    queryFn: () => walletService.get(accountId!),
    enabled: Boolean(accountId),
    staleTime: 30_000,
  });
}

export function useWalletTransactionsQuery(accountId: string | undefined) {
  return useQuery({
    queryKey: txKey(accountId ?? ''),
    queryFn: () => walletService.transactions(accountId!),
    enabled: Boolean(accountId),
    staleTime: 30_000,
  });
}

export function useCreateTopUpMutation(accountId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amountCents: number) => walletService.createTopUp(accountId!, amountCents),
    // Stripe Checkout is a full redirect; the wallet is refetched on return.
    onSuccess: ({ url }) => {
      void qc.invalidateQueries({ queryKey: walletKey(accountId ?? '') });
      window.location.assign(url);
    },
  });
}
