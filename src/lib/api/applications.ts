import type { ApplicationRecord, PipelineStatus } from "@/types/application";
import { pipelineColumns } from "@/types/application";
import { mockApplications } from "@/lib/mock/applications";
import { API_URL, apiFetch, isLiveApi, isMockData, type ApiResult } from "@/lib/api/client";

const STORAGE_KEY = "careeros:applications";

const listeners = new Set<() => void>();
let cache: ApplicationRecord[] | null = null;

function read(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  // Live mode is served by the backend, not this local store.
  if (isLiveApi()) return cache ?? [];
  // Without mock mode there is no backend, so there is genuinely nothing to
  // show. Returning the mock seed here would make callers that don't gate
  // display fabricated counts as if real.
  if (!isMockData()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApplicationRecord[];
  } catch {
    // fall through to seed
  }
  return mockApplications;
}

function write(records: ApplicationRecord[]) {
  if (!isLiveApi()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
  cache = records;
  listeners.forEach((l) => l());
}

export function subscribeApplications(onChange: () => void) {
  listeners.add(onChange);
  if (isLiveApi() && cache === null) {
    // Prime the store from the backend the first time anything subscribes.
    cache = [];
    void refreshApplications();
  }
  return () => listeners.delete(onChange);
}

export function getApplicationsSnapshot(): ApplicationRecord[] {
  if (cache === null) cache = read();
  return cache;
}

export async function refreshApplications(): Promise<void> {
  if (!isLiveApi()) return;
  const res = await apiFetch<{ applications: ApplicationRecord[] }>("/api/applications");
  if (res.ok) write(res.data.applications);
}

export async function listApplications(): Promise<ApiResult<ApplicationRecord[]>> {
  if (isLiveApi()) {
    const res = await apiFetch<{ applications: ApplicationRecord[] }>("/api/applications");
    if (!res.ok) return res;
    write(res.data.applications);
    return { ok: true, data: res.data.applications };
  }
  if (!isMockData()) return { ok: false, reason: "not_connected" };
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true, data: getApplicationsSnapshot() };
}

export async function getApplication(id: string): Promise<ApiResult<ApplicationRecord>> {
  if (isLiveApi()) {
    return apiFetch<ApplicationRecord>(`/api/applications/${encodeURIComponent(id)}`);
  }
  if (!isMockData()) return { ok: false, reason: "not_connected" };
  await new Promise((r) => setTimeout(r, 200));
  const record = getApplicationsSnapshot().find((a) => a.id === id);
  if (!record) return { ok: false, reason: "not_found" };
  return { ok: true, data: record };
}

const nonTerminalOrder: PipelineStatus[] = pipelineColumns
  .map((c) => c.value)
  .filter((v) => v !== "rejected");

export function nextStatus(status: PipelineStatus): PipelineStatus | null {
  const idx = nonTerminalOrder.indexOf(status);
  if (idx === -1 || idx === nonTerminalOrder.length - 1) return null;
  return nonTerminalOrder[idx + 1];
}

export function advanceApplication(id: string) {
  const records = getApplicationsSnapshot();
  const record = records.find((a) => a.id === id);
  if (!record) return;
  const next = nextStatus(record.status);
  if (!next) return;

  const label = pipelineColumns.find((c) => c.value === next)?.label ?? next;

  if (isLiveApi()) {
    void fetch(`${API_URL}/api/applications/${encodeURIComponent(id)}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, note: `Moved to ${label}` }),
    }).then(() => refreshApplications());
    return;
  }

  const updated: ApplicationRecord = {
    ...record,
    status: next,
    timeline: [
      ...record.timeline,
      { id: `t_${Date.now()}`, label: `Moved to ${label}`, timestamp: new Date().toISOString() },
    ],
  };
  write(records.map((a) => (a.id === id ? updated : a)));
}
