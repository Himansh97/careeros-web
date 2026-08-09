import type { ApprovalItem } from "@/types/approval";
import { mockApprovals } from "@/lib/mock/approvals";
import { API_URL, apiFetch, isLiveApi, isMockData, type ApiResult } from "@/lib/api/client";

const STORAGE_KEY = "careeros:approvals";

const listeners = new Set<() => void>();
let cache: ApprovalItem[] | null = null;

function read(): ApprovalItem[] {
  if (typeof window === "undefined") return [];
  if (isLiveApi()) return cache ?? [];
  // See the equivalent note in applications.ts — no backend means no data,
  // not mock data dressed up as real.
  if (!isMockData()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApprovalItem[];
  } catch {
    // fall through to seed
  }
  return mockApprovals;
}

function write(items: ApprovalItem[]) {
  if (!isLiveApi()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  cache = items;
  listeners.forEach((l) => l());
}

export function subscribeApprovals(onChange: () => void) {
  listeners.add(onChange);
  if (isLiveApi() && cache === null) {
    cache = [];
    void refreshApprovals();
  }
  return () => listeners.delete(onChange);
}

export function getApprovalsSnapshot(): ApprovalItem[] {
  if (cache === null) cache = read();
  return cache;
}

export async function refreshApprovals(): Promise<void> {
  if (!isLiveApi()) return;
  const res = await apiFetch<{ approvals: ApprovalItem[] }>("/api/approvals");
  if (res.ok) write(res.data.approvals);
}

export async function listApprovals(): Promise<ApiResult<ApprovalItem[]>> {
  if (isLiveApi()) {
    const res = await apiFetch<{ approvals: ApprovalItem[] }>("/api/approvals");
    if (!res.ok) return res;
    write(res.data.approvals);
    return { ok: true, data: res.data.approvals };
  }
  if (!isMockData()) return { ok: false, reason: "not_connected" };
  await new Promise((r) => setTimeout(r, 200));
  return { ok: true, data: getApprovalsSnapshot() };
}

function resolveRemote(id: string, action: "approved" | "rejected") {
  void fetch(`${API_URL}/api/approvals/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  }).then(() => refreshApprovals());
}

export function approveItem(id: string) {
  if (isLiveApi()) return resolveRemote(id, "approved");
  write(getApprovalsSnapshot().map((a) => (a.id === id ? { ...a, status: "approved" as const } : a)));
}

export function rejectItem(id: string) {
  if (isLiveApi()) return resolveRemote(id, "rejected");
  write(getApprovalsSnapshot().map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a)));
}

export function answerQuestion(id: string) {
  if (isLiveApi()) return resolveRemote(id, "approved");
  write(getApprovalsSnapshot().map((a) => (a.id === id ? { ...a, status: "answered" as const } : a)));
}
