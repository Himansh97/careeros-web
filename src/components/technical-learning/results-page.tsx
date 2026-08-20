"use client";

import { useQuery } from "@tanstack/react-query";

import { Scorecard } from "./scorecard";
import { getTechnicalSession } from "@/lib/api/technical-learning";

export function ResultsPage({ sessionId }: { sessionId: string }) {
  const session = useQuery({ queryKey: ["technical", "session", sessionId], queryFn: () => getTechnicalSession(sessionId) });
  if (session.isLoading) return <div className="h-96 animate-pulse border border-border bg-muted" />;
  if (!session.data?.ok || !session.data.data.scorecard) return <div role="alert" className="border border-border bg-card p-6">This scorecard is not ready.</div>;
  return <Scorecard session={session.data.data} />;
}
