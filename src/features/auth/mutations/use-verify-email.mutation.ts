'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { VerifyEmailRequest } from '../types/auth.types';

type VerifyEmailMutationOptions = Pick<
  UseMutationOptions<void, unknown, VerifyEmailRequest>,
  'onSuccess' | 'onError'
>;

/**
 * Backend: 2xx on success, 400 { code: 'TOKEN_INVALID' } otherwise.
 *
 * Callbacks are passed here (hook-level options), not to a per-call
 * `mutate(vars, { onSuccess })`: under StrictMode's simulated unmount/remount,
 * TanStack detaches the per-call observer and those callbacks never fire,
 * while hook-level options live on the mutation itself and still run.
 */
export function useVerifyEmailMutation(options: VerifyEmailMutationOptions = {}) {
  return useMutation<void, unknown, VerifyEmailRequest>({
    mutationFn: (payload) => authService.verifyEmail(payload),
    ...options,
  });
}
