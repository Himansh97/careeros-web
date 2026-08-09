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
}

export async function getHealth(): Promise<ApiResult<HealthStatus>> {
  if (!isLiveApi()) return { ok: false, reason: "not_connected" };
  return apiFetch<HealthStatus>("/api/health");
}
