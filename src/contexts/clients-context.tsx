'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Client } from '@/lib/types';

const STORAGE_KEY = 'dashfw-clients';

type ClientsContextValue = {
  clients: Client[];
  addClient: (data: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, data: Partial<Omit<Client, 'id'>>) => void;
  getClient: (id: string) => Client | undefined;
};

const ClientsContext = createContext<ClientsContextValue | null>(null);

function persist(next: Client[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function ClientsProvider({
  children,
  initialClients,
}: {
  children: ReactNode;
  initialClients: Client[];
}) {
  const [clients, setClients] = useState<Client[]>(initialClients);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Client[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClients(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const addClient = useCallback((data: Omit<Client, 'id'>) => {
    const id = `client-${Date.now()}`;
    const created: Client = { ...data, id };
    setClients((prev) => {
      const next = [...prev, created];
      persist(next);
      return next;
    });
    return created;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
      persist(next);
      return next;
    });
  }, []);

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  const value = useMemo(
    () => ({ clients, addClient, updateClient, getClient }),
    [clients, addClient, updateClient, getClient]
  );

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>;
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) {
    throw new Error('useClients must be used within ClientsProvider');
  }
  return ctx;
}
