import { apiClient } from '@/shared/api/client';
import type {
  AdResponse,
  CreateAdRequest,
  UpdateAdRequest,
  ChangeAdStatusRequest,
  AdReportResponse,
  AdReviewEntry,
} from '../types/advertisement.types';

// GET /ads is membership-scoped server-side (AdsController#list reads
// req.user.id) — no orgId/query param, unlike the live-show-react version.
export const advertisementsService = {
  list: async (): Promise<AdResponse[]> => {
    const { data } = await apiClient.get<AdResponse[]>('/ads');
    return data;
  },

  getOne: async (id: string): Promise<AdResponse> => {
    const { data } = await apiClient.get<AdResponse>(`/ads/${id}`);
    return data;
  },

  getReviews: async (id: string): Promise<AdReviewEntry[]> => {
    const { data } = await apiClient.get<AdReviewEntry[]>(`/ads/${id}/reviews`);
    return data;
  },

  create: async (payload: CreateAdRequest): Promise<AdResponse> => {
    const { data } = await apiClient.post<AdResponse>('/ads', payload);
    return data;
  },

  update: async (id: string, payload: UpdateAdRequest): Promise<void> => {
    await apiClient.patch(`/ads/${id}`, payload);
  },

  changeStatus: async (id: string, payload: ChangeAdStatusRequest): Promise<void> => {
    await apiClient.patch(`/ads/${id}/status`, payload);
  },

  getReport: async (id: string): Promise<AdReportResponse> => {
    const { data } = await apiClient.get<AdReportResponse>(`/ads/${id}/report`);
    return data;
  },

  uploadBanner: async (id: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ bannerUrl: string }>(`/ads/${id}/banner`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.bannerUrl;
  },
};
