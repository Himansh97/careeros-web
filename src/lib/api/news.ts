import { apiFetch } from "@/lib/api/client";

/**
 * Recent movement in tech and AI, proxied by the backend from public feeds.
 *
 * `failures` names any feed that could not be read this cycle. The strip must
 * say which one is missing rather than quietly showing a shorter list — a
 * shorter list is indistinguishable from a quiet news day, which is exactly
 * how a dead feed goes unnoticed for a week.
 *
 * Titles are what the source published. Nothing here is summarised or
 * rewritten, so a headline can be trusted to say what its article says.
 */
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  /** "Hacker News" | "arXiv" | "GitHub" */
  source: string;
  /** "AI" | "Data" | "Infra" | "Fintech" | "Tech" — keyword-tagged, not classified. */
  topic: string;
  /** ISO 8601. */
  at: string;
  /** Source-specific context: "312 points", "cs.LG", "1,204 stars". */
  meta: string;
}

export interface NewsFeed {
  items: NewsItem[];
  failures: string[];
  readAt: string;
  sources: Record<string, string>;
}

export const getNews = () => apiFetch<NewsFeed>("/api/news");
