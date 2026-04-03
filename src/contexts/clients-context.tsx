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
    const newSocials = data.socials?.map((s, i) => ({ ...s, id: `soc-${Date.now()}-${i}` })) || [];
    const created: Client = { ...data, id, socials: newSocials };
    setClients((prev) => {
      const next = [created, ...prev];
      persist(next);
      return next;
    });
    return created;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const updatedClient = { ...c, ...data };
          // Ensure new socials have IDs
          updatedClient.socials = updatedClient.socials?.map((s, i) => ({
            ...s,
            id: s.id || `soc-${Date.now()}-${i}`,
          }));
          return updatedClient;
        }
        return c;
      });
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
