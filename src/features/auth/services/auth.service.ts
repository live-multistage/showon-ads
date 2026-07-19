import { apiClient } from '@/shared/api/client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';

// AuthController: POST /auth/login and /auth/register both return
// { user, accessToken, refreshToken, refreshExpiresAt } — register already
// authenticates the new user, so signup never needs a follow-up login call.
export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },
};
