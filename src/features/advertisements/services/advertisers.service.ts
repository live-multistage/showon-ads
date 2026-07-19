import { apiClient } from '@/shared/api/client';
import type { AdvertiserAccountResponse, CreateAdvertiserRequest } from '../types/advertisement.types';

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
};
