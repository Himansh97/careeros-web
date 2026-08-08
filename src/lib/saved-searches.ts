import type { JobSearchFilters } from "@/types/job";

const STORAGE_KEY = "careeros:saved-searches";

export interface SavedSearch {
  id: string;
  label: string;
  filters: JobSearchFilters;
  autoRerun: boolean;
  createdAt: string;
  lastRunAt: string | null;
}

const listeners = new Set<() => void>();
let cache: SavedSearch[] | null = null;

function read(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function write(searches: SavedSearch[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  cache = searches;
  listeners.forEach((l) => l());
}

export function subscribeSavedSearches(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getSavedSearchesSnapshot(): SavedSearch[] {
  if (cache === null) cache = read();
  return cache;
}

export function saveSearch(label: string, filters: JobSearchFilters): SavedSearch {
  const now = new Date().toISOString();
  const entry: SavedSearch = {
    id: `search_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
    label,
    filters,
    autoRerun: false,
    createdAt: now,
    lastRunAt: null,
  };
  write([entry, ...read()]);
  return entry;
}

export function removeSavedSearch(id: string) {
  write(read().filter((s) => s.id !== id));
}

export function toggleAutoRerun(id: string) {
  write(read().map((s) => (s.id === id ? { ...s, autoRerun: !s.autoRerun } : s)));
}
