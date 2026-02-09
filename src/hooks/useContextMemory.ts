import { useEffect, useState } from "react";
import {
  loadContext,
  saveContext,
  upsertContextEntry,
  type ContextEntry
} from "@/lib/context/memory";

export function useContextMemory() {
  const [entries, setEntries] = useState<ContextEntry[]>([]);

  useEffect(() => {
    setEntries(loadContext());
  }, []);

  function upsert(entry: Omit<ContextEntry, "updatedAt">) {
    setEntries((prev) => {
      const next = upsertContextEntry(prev, entry);
      saveContext(next);
      return next;
    });
  }

  return { entries, upsert };
}
