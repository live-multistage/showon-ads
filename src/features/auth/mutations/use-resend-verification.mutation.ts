'use client';

import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';

/** Always 202 on the backend — errors here mean the request itself failed (network/5xx). */
export function useResendVerificationMutation() {
  return useMutation<void, unknown, { email: string }>({
    mutationFn: ({ email }) => authService.resendVerification(email),
  });
}
