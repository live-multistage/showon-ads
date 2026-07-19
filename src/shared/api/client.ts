'use client';

// Mirrors live-show-react's API client shape (src/lib/http/client.ts +
// interceptors.ts + errors.ts): axios instance, JWT injected from storage,
// JSON error normalization. Consolidated into one file since this app has no
// auth flow yet (that lands in a later task) — nothing else depends on it.
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api').replace(/\/$/, '');

export interface AppError {
  message: string;
  status: number;
  code?: string;
}

export function normalizeError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status ?? 0,
      code: error.response?.data?.code,
    };
  }
  return { message: 'Unexpected error', status: 0 };
}

const TOKEN_STORAGE_KEY = 'access_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: rawApiUrl,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) req.headers.set('Authorization', `Bearer ${token}`);
  return req;
});

// ponytail: no 401/refresh flow yet — this app has no login/refresh endpoint
// to call. Port live-show-react's response interceptor (src/lib/http/
// interceptors.ts: refresh queue + clearSession) once the auth module lands.
