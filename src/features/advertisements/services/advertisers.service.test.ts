import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/shared/api/client';
import { advertisersService } from './advertisers.service';
import type {
  AdvertiserAccountResponse,
  AdvertiserInvite,
  AdvertiserInvitePreview,
  AdvertiserInviteView,
  AdvertiserMemberResponse,
  CreateInviteResult,
} from '../types/advertisement.types';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient, true);

describe('advertisersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an advertiser account', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as AdvertiserAccountResponse });

    await advertisersService.create({ name: 'Acme Corp' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/advertisers', { name: 'Acme Corp' });
  });

  it('lists the caller\'s advertiser accounts with no id param', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] });

    await advertisersService.me();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/advertisers/me');
  });

  it('lists members of an advertiser account', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] as AdvertiserMemberResponse[] });

    await advertisersService.members('acct-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/advertisers/acct-1/members');
  });

  it('renames an advertiser account', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({ data: {} as AdvertiserAccountResponse });

    await advertisersService.rename('acct-1', { name: 'New Name' });

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/advertisers/acct-1', { name: 'New Name' });
  });

  it('creates an invite', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as CreateInviteResult });

    await advertisersService.createInvite('acct-1', { email: 'a@b.com', role: 'MANAGER' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/advertisers/acct-1/invites', {
      email: 'a@b.com',
      role: 'MANAGER',
    });
  });

  it('lists pending invites of an advertiser account', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: [] as AdvertiserInviteView[] });

    await advertisersService.listInvites('acct-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/advertisers/acct-1/invites');
  });

  it('revokes an invite', async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ data: undefined });

    await advertisersService.revokeInvite('acct-1', 'inv-1');

    expect(mockedApiClient.delete).toHaveBeenCalledWith('/advertisers/acct-1/invites/inv-1');
  });

  it('gets an invite preview by token', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: {} as AdvertiserInvitePreview });

    await advertisersService.getInvitePreview('tok-1');

    expect(mockedApiClient.get).toHaveBeenCalledWith('/advertiser-invites/tok-1');
  });

  it('accepts an invite by token', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: {} as AdvertiserInvite });

    await advertisersService.acceptInvite('tok-1');

    expect(mockedApiClient.post).toHaveBeenCalledWith('/advertiser-invites/tok-1/accept');
  });
});
