import { apiClient } from '@/shared/api/client';
import type {
  AdvertiserAccountResponse,
  AdvertiserInvite,
  AdvertiserInvitePreview,
  AdvertiserInviteView,
  AdvertiserMemberResponse,
  CreateAdvertiserRequest,
  CreateInviteRequest,
  CreateInviteResult,
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

  // OWNER-only server-side — PENDING invites for the account, no token field.
  listInvites: async (accountId: string): Promise<AdvertiserInviteView[]> => {
    const { data } = await apiClient.get<AdvertiserInviteView[]>(`/advertisers/${accountId}/invites`);
    return data;
  },

  // OWNER-only server-side — response includes the invite (with token) and
  // the shareable accept URL.
  createInvite: async (accountId: string, payload: CreateInviteRequest): Promise<CreateInviteResult> => {
    const { data } = await apiClient.post<CreateInviteResult>(`/advertisers/${accountId}/invites`, payload);
    return data;
  },

  // OWNER-only server-side.
  revokeInvite: async (accountId: string, inviteId: string): Promise<void> => {
    await apiClient.delete(`/advertisers/${accountId}/invites/${inviteId}`);
  },

  // Token-authenticated (no auth header) — preview shown before accepting.
  getInvitePreview: async (token: string): Promise<AdvertiserInvitePreview> => {
    const { data } = await apiClient.get<AdvertiserInvitePreview>(`/advertiser-invites/${token}`);
    return data;
  },

  // Token-authenticated — accepts the invite for the logged-in caller.
  acceptInvite: async (token: string): Promise<AdvertiserInvite> => {
    const { data } = await apiClient.post<AdvertiserInvite>(`/advertiser-invites/${token}/accept`);
    return data;
  },
};
