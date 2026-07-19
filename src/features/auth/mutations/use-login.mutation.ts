'use client';

import { useMutation } from '@tanstack/react-query';
import { setSession } from '@/shared/api/client';
import { authService } from '../services/auth.service';
import type { AuthResponse, LoginRequest } from '../types/auth.types';

export function useLoginMutation() {
  return useMutation<AuthResponse, unknown, LoginRequest>({
    mutationFn: (payload) => authService.login(payload),
    onSuccess: (data) => {
      setSession(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}
