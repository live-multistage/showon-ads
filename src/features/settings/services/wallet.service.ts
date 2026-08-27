import { apiClient } from '@/shared/api/client';

export interface WalletSummary {
  balanceCents: number;
  currency: string;
  lowBalance: boolean;
}

export interface WalletTransactionView {
  id: string;
  type: 'TOPUP' | 'DEBIT' | 'ADJUSTMENT';
  amountCents: number;
  reference: string;
  createdAt: string;
}

export const walletService = {
  get: async (accountId: string): Promise<WalletSummary> => {
    const { data } = await apiClient.get<WalletSummary>(`/advertisers/${accountId}/wallet`);
    return data;
  },

  transactions: async (accountId: string, limit = 25): Promise<WalletTransactionView[]> => {
    const { data } = await apiClient.get<WalletTransactionView[]>(
      `/advertisers/${accountId}/wallet/transactions`,
      { params: { limit } },
    );
    return data;
  },

  createTopUp: async (accountId: string, amountCents: number): Promise<{ url: string }> => {
    const { data } = await apiClient.post<{ url: string }>(
      `/advertisers/${accountId}/wallet/topups`,
      { amountCents },
    );
    return data;
  },
};
