import { apiClient } from '@/shared/api/client';
import type {
  AdResponse,
  CreateAdRequest,
  UpdateAdRequest,
  ChangeAdStatusRequest,
  AdPauseStats,
  AdReportResponse,
  AdVideoStats,
  AdReviewEntry,
} from '../types/advertisement.types';

const EMPTY_VIDEO_STATS: AdVideoStats = { q25: 0, q50: 0, q75: 0, complete: 0, skip: 0, unmute: 0 };
const EMPTY_PAUSE_STATS: AdPauseStats = { closed: 0 };

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
    // An API deployed before the format counters (video/pause) omits them; read as zero.
    return {
      ...data,
      video: { ...EMPTY_VIDEO_STATS, ...data.video },
      pause: { ...EMPTY_PAUSE_STATS, ...data.pause },
    };
  },

  uploadBanner: async (id: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ bannerUrl: string }>(`/ads/${id}/banner`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.bannerUrl;
  },

  uploadVideo: async (id: string, file: File): Promise<{ videoUrl: string; videoDurationSec: number }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<{ videoUrl: string; videoDurationSec: number }>(`/ads/${id}/video`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
