export type ContextEntry = {
  id: string;
  label: string;
  value: string;
  updatedAt: string;
};

const STORAGE_KEY = "clarify:context-memory";

export function loadContext(): ContextEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContextEntry[];
  } catch {
    return [];
  }
}

export function saveContext(entries: ContextEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function upsertContextEntry(
  entries: ContextEntry[],
  next: Omit<ContextEntry, "updatedAt">
) {
  const updatedAt = new Date().toISOString();
  const existing = entries.find((entry) => entry.id === next.id);
  if (existing) {
    return entries.map((entry) =>
      entry.id === next.id
        ? { ...entry, label: next.label, value: next.value, updatedAt }
        : entry
    );
  }
  return [...entries, { ...next, updatedAt }];
}
