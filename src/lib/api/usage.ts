import { apiFetch } from "@/lib/api/client";

/**
 * API spend for the resume writer.
 *
 * `costUsd` is computed by the backend from the published per-token rates at
 * the time of each call — it is not read back from Anthropic. It tracks the
 * invoice closely and is not the invoice, and the UI says so rather than
 * implying a precision it does not have.
 */
export interface UsageBudget {
  today: number;
  month: number;
  dailyBudget: number;
  monthlyBudget: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  blocked: boolean;
  reason: string | null;
}

export interface UsageCall {
  at: string;
  model: string;
  purpose: string;
  job_id: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
  ok: number;
  detail: string | null;
}

export interface UsageSummary {
  windowDays: number;
  totals: {
    calls: number;
    failed: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUsd: number;
  };
  byDay: { day: string; calls: number; cost: number; tokens: number }[];
  byPurpose: { purpose: string; calls: number; cost: number }[];
  byModel: { model: string; calls: number; cost: number }[];
  recent: UsageCall[];
  budget: UsageBudget;
  prices: Record<string, Record<string, number>>;
  note: string;
}

export const getUsage = (days = 30) => apiFetch<UsageSummary>(`/api/usage?days=${days}`);
export const getBudget = () => apiFetch<UsageBudget>("/api/usage/budget");
