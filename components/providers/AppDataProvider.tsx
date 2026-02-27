"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DomainSnapshot } from "@/lib/domain/types";

type AppDataContextValue = {
  snapshot: DomainSnapshot;
  activeChoirId: string;
  setActiveChoirId: (choirId: string) => Promise<void>;
  replaceSnapshot: (next: DomainSnapshot) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);
const SNAPSHOT_QUERY_KEY = ["context", "snapshot"] as const;

const fetchSnapshot = async (signal?: AbortSignal): Promise<DomainSnapshot> => {
  const response = await fetch("/api/context/snapshot", {
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error("Failed to fetch context snapshot");
  }

  return (await response.json()) as DomainSnapshot;
};

export default function AppDataProvider({
  initialSnapshot,
  children
}: {
  initialSnapshot: DomainSnapshot;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: snapshot = initialSnapshot } = useQuery({
    queryKey: SNAPSHOT_QUERY_KEY,
    queryFn: ({ signal }) => fetchSnapshot(signal),
    initialData: initialSnapshot,
    staleTime: 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  useEffect(() => {
    queryClient.setQueryData(SNAPSHOT_QUERY_KEY, initialSnapshot);
  }, [initialSnapshot, queryClient]);

  const setActiveChoirId = useCallback(async (choirId: string) => {
    const response = await fetch("/api/context/active-choir", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ choirId })
    });

    if (!response.ok) {
      throw new Error("Failed to update active choir");
    }

    queryClient.setQueryData<DomainSnapshot>(SNAPSHOT_QUERY_KEY, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        activeChoirId: choirId,
        personSettings: {
          ...prev.personSettings,
          active_choir_id: choirId
        }
      };
    });
  }, [queryClient]);

  const replaceSnapshot = useCallback((next: DomainSnapshot) => {
    queryClient.setQueryData(SNAPSHOT_QUERY_KEY, next);
  }, [queryClient]);

  const value = useMemo(
    () => ({
      snapshot,
      activeChoirId: snapshot.activeChoirId,
      setActiveChoirId,
      replaceSnapshot
    }),
    [replaceSnapshot, setActiveChoirId, snapshot]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppDataContext = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppDataContext must be used within AppDataProvider");
  }
  return context;
};
