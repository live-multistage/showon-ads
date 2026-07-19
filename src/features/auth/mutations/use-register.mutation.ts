'use client';

import { useMutation } from '@tanstack/react-query';
import { setSession } from '@/shared/api/client';
import { authService } from '../services/auth.service';
import type { AuthResponse, RegisterRequest } from '../types/auth.types';

export function useRegisterMutation() {
  return useMutation<AuthResponse, unknown, RegisterRequest>({
    mutationFn: (payload) => authService.register(payload),
    onSuccess: (data) => {
      setSession(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}
