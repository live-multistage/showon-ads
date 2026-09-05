'use client';

// Mirrors live-show-react's API client shape (src/lib/http/client.ts +
// interceptors.ts + errors.ts): axios instance, JWT injected from storage,
// JSON error normalization. The 401/refresh queue below is adapted for this
// app's storage model — live-show-react keeps the access token in memory and
// refreshes via an httpOnly-cookie BFF route; this app has no server-side
// session layer, so both tokens live in localStorage and refresh calls the
// orchestrator directly.
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api').replace(/\/$/, '');

export interface AppError {
  message: string;
  status: number;
  code?: string;
  requestId?: string;
}

export function normalizeError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    // The header we sent is authoritative; the response body's requestId
    // (set by nestjs-pino) is a fallback for errors that never reach our
    // interceptor, e.g. an nginx 5xx.
    const sentRequestId = error.config?.headers?.['X-Request-Id'] as string | undefined;
    return {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status ?? 0,
      code: error.response?.data?.code,
      requestId: sentRequestId ?? error.response?.data?.requestId,
    };
  }
  return { message: 'Unexpected error', status: 0 };
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

export interface StoredAuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): StoredAuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export function setSession(user: StoredAuthUser, tokens: SessionTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: rawApiUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) req.headers.set('Authorization', `Bearer ${token}`);
  // Correlates this request with backend logs end-to-end (nestjs-pino echoes it back).
  // crypto.randomUUID is a native Web Crypto API — no dependency needed.
  req.headers.set('X-Request-Id', crypto.randomUUID());
  return req;
});

// 401 refresh queue, ported from live-show-react's src/lib/http/interceptors.ts.
// One in-flight refresh call at a time; concurrent 401s queue behind it and
// retry with the rotated access token once it resolves.
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const refreshToken = getStoredRefreshToken();

    if (!original || error.response?.status !== 401 || original._retry || !refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.set('Authorization', `Bearer ${token}`);
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Plain axios, not apiClient — this call must not carry the (expired)
      // Authorization header or re-enter this same interceptor.
      const { data } = await axios.post<RefreshResponse>(`${rawApiUrl}/auth/refresh`, { refreshToken });

      // The orchestrator rotates the refresh token on every use (theft
      // detection) — the old one is now invalid, so persist the new pair.
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

      processQueue(null, data.accessToken);
      original.headers.set('Authorization', `Bearer ${data.accessToken}`);
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearSession();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
