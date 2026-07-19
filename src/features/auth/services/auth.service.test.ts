import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/shared/api/client';
import { authService } from './auth.service';
import type { AuthResponse } from '../types/auth.types';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient, true);

const authResponse: AuthResponse = {
  user: { id: 'u1', email: 'a@b.com', displayName: 'A', role: 'USER', createdAt: '', updatedAt: '' },
  accessToken: 'access',
  refreshToken: 'refresh',
  refreshExpiresAt: '2026-01-01T00:00:00.000Z',
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in against /auth/login', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: authResponse });

    const result = await authService.login({ email: 'a@b.com', password: 'secret123' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'secret123' });
    expect(result).toEqual(authResponse);
  });

  it('registers against /auth/register', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: authResponse });

    const result = await authService.register({ email: 'a@b.com', displayName: 'A', password: 'secret123' });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'a@b.com',
      displayName: 'A',
      password: 'secret123',
    });
    expect(result).toEqual(authResponse);
  });
});
