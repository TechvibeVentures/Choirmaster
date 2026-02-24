"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";
import type { DomainSnapshot } from "@/lib/domain/types";

type AppDataContextValue = {
  snapshot: DomainSnapshot;
  activeChoirId: string;
  setActiveChoirId: (choirId: string) => Promise<void>;
  replaceSnapshot: (next: DomainSnapshot) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export default function AppDataProvider({
  initialSnapshot,
  children
}: {
  initialSnapshot: DomainSnapshot;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<DomainSnapshot>(initialSnapshot);
  const pathname = usePathname();

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (!pathname) return;

    const controller = new AbortController();
    const run = async () => {
      try {
        const response = await fetch("/api/context/snapshot", {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) return;
        const nextSnapshot = (await response.json()) as DomainSnapshot;
        setSnapshot(nextSnapshot);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("AppDataProvider snapshot refresh error", error);
      }
    };

    void run();

    return () => controller.abort();
  }, [pathname]);

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

    setSnapshot((prev) => ({
      ...prev,
      activeChoirId: choirId,
      personSettings: {
        ...prev.personSettings,
        active_choir_id: choirId
      }
    }));
  }, []);

  const value = useMemo(
    () => ({
      snapshot,
      activeChoirId: snapshot.activeChoirId,
      setActiveChoirId,
      replaceSnapshot: (next: DomainSnapshot) => setSnapshot(next)
    }),
    [setActiveChoirId, snapshot]
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
