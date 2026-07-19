import { describe, it, expect, beforeEach } from 'vitest';
import type { AxiosHeaders } from 'axios';
import { apiClient } from './client';

// Verifies the request interceptor actually attaches the Bearer token from
// localStorage (or omits it) — the piece every advertisements/advertisers
// service call relies on for auth, without hitting the network.
describe('apiClient auth interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    apiClient.defaults.adapter = async (config) => ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  });

  it('attaches a Bearer header when a token is stored', async () => {
    localStorage.setItem('access_token', 'test-token');

    const response = await apiClient.get('/ping');

    const headers = response.config.headers as AxiosHeaders;
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('omits the Authorization header when no token is stored', async () => {
    const response = await apiClient.get('/ping');

    const headers = response.config.headers as AxiosHeaders;
    expect(headers.get('Authorization')).toBeUndefined();
  });
});
