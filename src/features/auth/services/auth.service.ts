import { apiClient } from '@/shared/api/client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
} from '../types/auth.types';

// AuthController: POST /auth/login returns { user, accessToken, refreshToken,
// refreshExpiresAt }. POST /auth/register now returns 201
// { verificationRequired: true } — the account needs its email confirmed
// before it can log in, so registration no longer starts a session.
export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
    return data;
  },

  resendVerification: async (email: string): Promise<void> => {
    // Always 202 — never reveals whether the address has a pending account.
    await apiClient.post('/auth/resend-verification', { email });
  },

  // 2xx on success; 400 { code: 'TOKEN_INVALID' } on unknown/expired/used token.
  verifyEmail: async (payload: VerifyEmailRequest): Promise<void> => {
    await apiClient.post('/auth/verify-email', payload);
  },
};
