import { useEffect, useState } from "react";

export type InputHistoryEntry = {
  input: string;
  createdAt: string;
};

const STORAGE_KEY = "clarify:input-history";

export function useInputHistory(limit = 5) {
  const [history, setHistory] = useState<InputHistoryEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as InputHistoryEntry[];
      setHistory(parsed);
    } catch {
      setHistory([]);
    }
  }, []);

  function addEntry(input: string) {
    const entry = { input, createdAt: new Date().toISOString() };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, limit);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore localStorage failures.
      }
      return next;
    });
  }

  return { history, addEntry };
}
