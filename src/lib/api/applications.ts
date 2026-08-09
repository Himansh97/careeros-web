import type { ApplicationRecord, PipelineStatus } from "@/types/application";
import { pipelineColumns } from "@/types/application";
import { mockApplications } from "@/lib/mock/applications";
import type { ApiResult } from "@/lib/api/jobs";

const STORAGE_KEY = "careeros:applications";

function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

const listeners = new Set<() => void>();
let cache: ApplicationRecord[] | null = null;

function read(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  // Without mock mode there is no backend, so there is genuinely nothing to
  // show. Returning the mock seed here would make callers that don't gate on
  // isMockMode() (e.g. the dashboard) display fabricated counts as if real.
  if (!isMockMode()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApplicationRecord[];
  } catch {
    // fall through to seed
  }
  return mockApplications;
}

function write(records: ApplicationRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  cache = records;
  listeners.forEach((l) => l());
}

export function subscribeApplications(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getApplicationsSnapshot(): ApplicationRecord[] {
  if (cache === null) cache = read();
  return cache;
}

export async function listApplications(): Promise<ApiResult<ApplicationRecord[]>> {
  if (!isMockMode()) return { ok: false, reason: "not_connected" };
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { ok: true, data: getApplicationsSnapshot() };
}

export async function getApplication(id: string): Promise<ApiResult<ApplicationRecord>> {
  if (!isMockMode()) return { ok: false, reason: "not_connected" };
  await new Promise((resolve) => setTimeout(resolve, 200));
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
