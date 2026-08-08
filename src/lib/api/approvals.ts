import type { ApprovalItem } from "@/types/approval";
import { mockApprovals } from "@/lib/mock/approvals";
import type { ApiResult } from "@/lib/api/jobs";

const STORAGE_KEY = "careeros:approvals";

function isMockMode() {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
}

const listeners = new Set<() => void>();
let cache: ApprovalItem[] | null = null;

function read(): ApprovalItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApprovalItem[];
  } catch {
    // fall through to seed
  }
  return mockApprovals;
}

function write(items: ApprovalItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  cache = items;
  listeners.forEach((l) => l());
}

export function subscribeApprovals(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getApprovalsSnapshot(): ApprovalItem[] {
  if (cache === null) cache = read();
  return cache;
}

export async function listApprovals(): Promise<ApiResult<ApprovalItem[]>> {
  if (!isMockMode()) return { ok: false, reason: "not_connected" };
  await new Promise((resolve) => setTimeout(resolve, 200));
  return { ok: true, data: getApprovalsSnapshot() };
}

export function approveItem(id: string) {
  write(getApprovalsSnapshot().map((a) => (a.id === id ? { ...a, status: "approved" as const } : a)));
}

export function rejectItem(id: string) {
  write(getApprovalsSnapshot().map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a)));
}

export function answerQuestion(id: string) {
  write(getApprovalsSnapshot().map((a) => (a.id === id ? { ...a, status: "answered" as const } : a)));
}
