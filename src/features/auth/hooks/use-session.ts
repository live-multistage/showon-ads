'use client';

import { useCallback, useEffect, useState } from 'react';
import { clearSession, getStoredUser, type StoredAuthUser } from '@/shared/api/client';

export interface UseSessionResult {
  user: StoredAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

// Hydrates from localStorage on mount (SSR renders no user, then the client
// re-render picks up whatever's stored) — no server-side session to read
// here, this app talks to the orchestrator directly.
export function useSession(): UseSessionResult {
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, []);

  return { user, isAuthenticated: !!user, isLoading, logout };
}
