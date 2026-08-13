import type { ApplicationRecord, PipelineStatus } from "@/types/application";
import { pipelineColumns } from "@/types/application";
import { mockApplications } from "@/lib/mock/applications";
import { API_URL, apiFetch, isLiveApi, isMockData, type ApiResult } from "@/lib/api/client";

const STORAGE_KEY = "careeros:applications";

const listeners = new Set<() => void>();
let cache: ApplicationRecord[] | null = null;
let fetched = false;

/**
 * Whether the first load has happened, and whether it worked.
 *
 * `refreshApplications` used to drop failures on the floor (`if (res.ok)`), so
 * an unreachable backend left the cache at `[]` and the page rendered
 * "No applications yet" — the same screen a genuinely empty pipeline produces.
 * Pages read this to tell those two apart.
 */
export type LoadState = "loading" | "ready" | "error";
let loadState: LoadState = isLiveApi() ? "loading" : "ready";

export function getApplicationsLoadState(): LoadState {
  return loadState;
}

function setLoadState(next: LoadState) {
  if (loadState === next) return;
  loadState = next;
  listeners.forEach((l) => l());
}

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
  if (isLiveApi() && !fetched) {
    // Prime from the backend on first subscribe. Guarded by an explicit
    // flag because React calls getSnapshot() first, which already
    // initialises cache — so a `cache === null` check never fires.
    fetched = true;
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
  if (res.ok) {
    write(res.data.applications);
    setLoadState("ready");
  } else {
    setLoadState("error");
  }
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

/**
 * Record how an application ended, and how far it got.
 *
 * Separate from advancing the pipeline: an outcome arrives at any stage, often
 * by email rather than a click, and must not be overwritten by a later status
 * change. The reason is whatever the employer actually said — nothing is
 * inferred, because a guess stored beside a stated reason becomes
 * indistinguishable from it.
 */
export async function recordOutcome(
  id: string,
  outcome: "rejected" | "offer" | "withdrawn",
  reason = "",
  stage = ""
): Promise<ApiResult<ApplicationRecord>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  const res = await apiFetch<ApplicationRecord>(
    `/api/applications/${encodeURIComponent(id)}/outcome`,
    { method: "POST", body: JSON.stringify({ outcome, reason, stage }) }
  );
  if (res.ok) await refreshApplications();
  return res;
}

/**
 * The snapshot React uses during server render, as one stable reference.
 *
 * React calls `getServerSnapshot` on every render and compares the result by
 * identity. An inline `() => []` hands back a new array each time, so React
 * sees state that never stops changing and warns that it will loop — which it
 * did, on every page that read this store. Six call sites each had their own
 * inline literal; they all share this one now.
 */
const EMPTY_APPLICATIONRECORD: ApplicationRecord[] = [];

export function getApplicationsServerSnapshot(): ApplicationRecord[] {
  return EMPTY_APPLICATIONRECORD;
}
