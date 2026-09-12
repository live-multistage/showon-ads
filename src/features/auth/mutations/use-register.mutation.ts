'use client';

import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { RegisterRequest, RegisterResponse } from '../types/auth.types';

// No setSession here: register no longer returns tokens (verification is
// required first), so there is nothing to start a session with.
export function useRegisterMutation() {
  return useMutation<RegisterResponse, unknown, RegisterRequest>({
    mutationFn: (payload) => authService.register(payload),
  });
}
