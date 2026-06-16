import { useCallback, useEffect, useState } from "react";

export interface HistoryEntry<T> {
  id: string;
  createdAt: number;
  label: string;
  input: T;
  output: string;
}

const MAX_ENTRIES = 5;

export function useLocalHistory<T>(storageKey: string) {
  const [entries, setEntries] = useState<HistoryEntry<T>[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEntries(JSON.parse(raw) as HistoryEntry<T>[]);
    } catch {
      // ignore corrupted storage
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: HistoryEntry<T>[]) => {
      setEntries(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // storage may be full / disabled
      }
    },
    [storageKey]
  );

  const add = useCallback(
    (entry: Omit<HistoryEntry<T>, "id" | "createdAt">) => {
      setEntries((prev) => {
        const next: HistoryEntry<T>[] = [
          {
            ...entry,
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: Date.now(),
          },
          ...prev,
        ].slice(0, MAX_ENTRIES);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [storageKey]
  );

  const remove = useCallback(
    (id: string) => {
      persist(entries.filter((e) => e.id !== id));
    },
    [entries, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { entries, add, remove, clear, max: MAX_ENTRIES };
}
