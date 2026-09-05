import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { AxiosError, type AxiosHeaders } from 'axios';
import { apiClient, clearSession, getStoredUser, normalizeError, setSession } from './client';

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

  it('sends a fresh X-Request-Id UUID on every request', async () => {
    const first = await apiClient.get('/ping');
    const second = await apiClient.get('/ping');

    const firstId = (first.config.headers as AxiosHeaders).get('X-Request-Id') as string;
    const secondId = (second.config.headers as AxiosHeaders).get('X-Request-Id') as string;
    expect(firstId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(firstId).not.toBe(secondId);
  });
});

describe('normalizeError', () => {
  it('surfaces the request-sent X-Request-Id', () => {
    const headers = { 'X-Request-Id': 'req-123' } as unknown as AxiosHeaders;
    const err = new AxiosError('boom', '500', { headers } as never, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers } as never,
      data: { message: 'boom' },
    });

    expect(normalizeError(err).requestId).toBe('req-123');
  });

  it('falls back to the response body requestId when the request had none', () => {
    const err = new AxiosError('boom', '500', {} as never, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as never,
      data: { message: 'boom', requestId: 'from-body' },
    });

    expect(normalizeError(err).requestId).toBe('from-body');
  });
});

describe('session storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reads back the session', () => {
    setSession(
      { id: 'u1', email: 'a@b.com', displayName: 'A', role: 'USER' },
      { accessToken: 'access-1', refreshToken: 'refresh-1' },
    );

    expect(getStoredUser()).toEqual({ id: 'u1', email: 'a@b.com', displayName: 'A', role: 'USER' });
    expect(localStorage.getItem('access_token')).toBe('access-1');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1');
  });

  it('clears all stored session data', () => {
    setSession(
      { id: 'u1', email: 'a@b.com', displayName: 'A', role: 'USER' },
      { accessToken: 'access-1', refreshToken: 'refresh-1' },
    );

    clearSession();

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

describe('apiClient 401 refresh flow', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'refresh-token');

    // Delete `window.location` to safely stub `.href` — jsdom's default
    // location setter for `.href` triggers real navigation.
    // @ts-expect-error -- intentional override for test isolation.
    delete window.location;
    // @ts-expect-error -- minimal stub, only `.href` is read by the interceptor.
    window.location = { href: '' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes the token and retries the original request once on a 401', async () => {
    let callCount = 0;
    apiClient.defaults.adapter = async (config) => {
      callCount += 1;
      if (callCount === 1) {
        const err = new AxiosError('Unauthorized', '401', config, {}, {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config,
        });
        throw err;
      }
      return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
    };

    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as never,
    });

    const response = await apiClient.get('/protected');

    expect(response.data).toEqual({ ok: true });
    expect(localStorage.getItem('access_token')).toBe('new-access');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
    const retriedHeaders = response.config.headers as AxiosHeaders;
    expect(retriedHeaders.get('Authorization')).toBe('Bearer new-access');
  });

  it('clears the session and redirects to /login when the refresh call fails', async () => {
    apiClient.defaults.adapter = async (config) => {
      const err = new AxiosError('Unauthorized', '401', config, {}, {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config,
      });
      throw err;
    };

    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('refresh_failed'));

    await expect(apiClient.get('/protected')).rejects.toThrow();

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
