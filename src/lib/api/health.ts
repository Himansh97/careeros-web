import { apiFetch, isLiveApi, type ApiResult } from "@/lib/api/client";

export interface HealthStatus {
  status: string;
  sources: string[];
  greenhouseCompanies: string[];
  lastFetchCounts: Record<string, number>;
  contactLookup: {
    enabled: boolean;
    note: string;
    providers: { name: string; configured: boolean; freeTier: string }[];
  };
  notCovered: Record<string, string>;
  /** Sources that errored on the last fetch. A failed source returns no jobs,
      which otherwise reads as an employer with no openings. */
  failedSources?: string[];
}

export async function getHealth(): Promise<ApiResult<HealthStatus>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<HealthStatus>("/api/health");
}
