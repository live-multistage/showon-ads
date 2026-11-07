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

export type PauseVariantKey = 'STANDARD' | 'FULLSCREEN';
export type BillingModelKey = 'CPM' | 'CPC';

export interface AdvertiserSettings {
  minTopupCents: number;
  lowBalanceThresholdCents: number;
  pauseMinBids: Record<PauseVariantKey, Record<BillingModelKey, number>>;
}

export const walletService = {
  get: async (accountId: string): Promise<WalletSummary> => {
    const { data } = await apiClient.get<WalletSummary>(`/advertisers/${accountId}/wallet`);
    return data;
  },

  // Valores da plataforma, não da conta: a rota não leva accountId.
  settings: async (): Promise<AdvertiserSettings> => {
    const { data } = await apiClient.get<AdvertiserSettings>('/advertisers/settings');
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
