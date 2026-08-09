"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Database,
  Users,
  Mail,
  Link2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isLiveApi } from "@/lib/api/client";
import { getHealth } from "@/lib/api/health";

export default function IntegrationsPage() {
  const live = isLiveApi();
  const { data, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    enabled: live,
  });

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Integrations" description="What CareerOS is connected to." />
        <EmptyState
          icon={AlertCircle}
          title="Not connected to the API"
          description="Start the CareerOS API and set NEXT_PUBLIC_API_URL to see real integration status."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Integrations" description="What CareerOS is connected to." />
        <EmptyState
          icon={AlertCircle}
          title="API unreachable"
          description="Couldn't read status from the CareerOS API."
          className="flex-1"
        />
      </div>
    );
  }

  const h = data.data;
  const totalJobs = Object.values(h.lastFetchCounts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Integrations"
        description="Live status straight from the API — what's connected, and exactly what each connection may do."
      />

      {/* Job sources */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Database className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-medium text-foreground">Job sources</h2>
          <Badge variant="secondary" className="ml-auto font-normal">
            {totalJobs.toLocaleString()} jobs last fetch
          </Badge>
        </div>
        <div className="divide-y divide-border">
          {h.sources.map((s) => (
            <div key={s} className="flex items-center gap-3 px-4 py-2.5">
              <CheckCircle2 className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
              <span className="text-sm text-foreground">{s}</span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {(h.lastFetchCounts?.[s] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact providers */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-medium text-foreground">Recruiter contact providers</h2>
          <Badge variant="secondary" className="ml-auto font-normal">
            tried in order, auto-failover
          </Badge>
        </div>
        <div className="divide-y divide-border">
          {h.contactLookup.providers.map((p) => (
            <div key={p.name} className="flex items-center gap-3 px-4 py-2.5">
              {p.configured ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
              ) : (
                <XCircle className="size-3.5 shrink-0 text-muted-foreground/50" strokeWidth={2} />
              )}
              <div className="min-w-0">
                <div className="text-sm text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.freeTier}</div>
              </div>
              <Badge
                variant="secondary"
                className="ml-auto font-normal"
              >
                {p.configured ? "Configured" : "No key"}
              </Badge>
            </div>
          ))}
        </div>
        <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          {h.contactLookup.note}
        </p>
      </div>

      {/* Deliberately not connected */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Link2 className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-medium text-foreground">Not covered, by choice</h2>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(h.notCovered ?? {}).map(([name, reason]) => (
            <div key={name} className="px-4 py-2.5">
              <div className="text-sm capitalize text-foreground">{name}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>
            </div>
          ))}
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Mail className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
              Email sending
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Not connected and not planned. Outreach produces a draft and a mailto
              link; you review and send it yourself.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
