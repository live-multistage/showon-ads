import { apiClient } from '@/shared/api/client';
import type {
  AdvertiserAccountResponse,
  AdvertiserMemberResponse,
  CreateAdvertiserRequest,
  UpdateAdvertiserRequest,
} from '../types/advertisement.types';

// AdvertisersController: self-service — any authenticated user may create an
// advertiser account (no @Roles gate); GET /advertisers/me lists caller's own.
export const advertisersService = {
  create: async (payload: CreateAdvertiserRequest): Promise<AdvertiserAccountResponse> => {
    const { data } = await apiClient.post<AdvertiserAccountResponse>('/advertisers', payload);
    return data;
  },

  me: async (): Promise<AdvertiserAccountResponse[]> => {
    const { data } = await apiClient.get<AdvertiserAccountResponse[]>('/advertisers/me');
    return data;
  },

  // Membership-guarded server-side (403 for non-members) — see
  // AdvertisersController.members in the orchestrator.
  members: async (accountId: string): Promise<AdvertiserMemberResponse[]> => {
    const { data } = await apiClient.get<AdvertiserMemberResponse[]>(`/advertisers/${accountId}/members`);
    return data;
  },

  // OWNER-only server-side (403 otherwise) — see AdvertisersController.rename.
  rename: async (
    accountId: string,
    payload: UpdateAdvertiserRequest,
  ): Promise<AdvertiserAccountResponse> => {
    const { data } = await apiClient.patch<AdvertiserAccountResponse>(`/advertisers/${accountId}`, payload);
    return data;
  },
};
