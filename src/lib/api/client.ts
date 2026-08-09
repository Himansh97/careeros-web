/**
 * HTTP client for the CareerOS API.
 *
 * When NEXT_PUBLIC_API_URL is set, the app talks to the real backend: live
 * job discovery, evidence-based scoring, tailoring, and outreach. Otherwise
 * it falls back to the mock layer (or honest not-connected states).
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_connected" | "not_found" | "error"; message?: string };

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const isLiveApi = () => API_URL !== "";
export const isMockData = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });

    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) {
      return { ok: false, reason: "error", message: `HTTP ${res.status}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    // A backend that isn't running is a normal state here, not a crash.
    return {
      ok: false,
      reason: "not_connected",
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}
