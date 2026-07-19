'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMyAdvertiserAccountsQuery } from '@/features/advertisements/queries/use-my-advertiser-accounts';
import type { AdvertiserAccountResponse } from '@/features/advertisements/types/advertisement.types';

export interface ActiveAdvertiserAccountContextValue {
  accounts: AdvertiserAccountResponse[];
  activeAccountId: string | null;
  setActiveAccountId: (id: string) => void;
  isLoading: boolean;
}

const ActiveAdvertiserAccountContext = createContext<ActiveAdvertiserAccountContextValue | null>(null);

// GET /ads returns every ad the caller can see across all their advertiser
// accounts (no server-side account filter). The switcher this context backs
// filters that list client-side by ad.advertiserAccountId — no backend change.
export function ActiveAdvertiserAccountProvider({ children }: { children: React.ReactNode }) {
  const { data: accounts = [], isLoading } = useMyAdvertiserAccountsQuery();
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (activeAccountId === null && accounts.length > 0) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  const value = useMemo<ActiveAdvertiserAccountContextValue>(
    () => ({ accounts, activeAccountId, setActiveAccountId, isLoading }),
    [accounts, activeAccountId, isLoading],
  );

  return (
    <ActiveAdvertiserAccountContext.Provider value={value}>
      {children}
    </ActiveAdvertiserAccountContext.Provider>
  );
}

export function useActiveAdvertiserAccount(): ActiveAdvertiserAccountContextValue {
  const context = useContext(ActiveAdvertiserAccountContext);
  if (!context) {
    throw new Error('useActiveAdvertiserAccount must be used within an ActiveAdvertiserAccountProvider');
  }
  return context;
}
