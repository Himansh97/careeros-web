"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Bookmark, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { isLiveApi } from "@/lib/api/client";
import {
  listSavedSearches,
  deleteSavedSearch,
  toggleSavedSearch,
  type SavedSearchRecord,
} from "@/lib/api/ops";

function describe(s: SavedSearchRecord): string {
  const f = s.filters ?? {};
  const parts: string[] = [];
  if (f.query) parts.push(String(f.query));
  if (f.location) parts.push(String(f.location));
  if (Array.isArray(f.workArrangements) && f.workArrangements.length)
    parts.push(f.workArrangements.join("/"));
  if (f.minimumFit) parts.push(`fit ${f.minimumFit}+`);
  return parts.length ? parts.join(" · ") : "All jobs";
}

export default function SavedSearchesPage() {
  const live = isLiveApi();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["saved-searches"],
    queryFn: listSavedSearches,
    enabled: live,
  });

  async function remove(id: string) {
    await deleteSavedSearch(id);
    toast("Saved search removed");
    qc.invalidateQueries({ queryKey: ["saved-searches"] });
  }

  async function toggle(id: string) {
    await toggleSavedSearch(id);
    qc.invalidateQueries({ queryKey: ["saved-searches"] });
  }

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Saved Searches" description="Reusable job searches." />
        <EmptyState
          icon={AlertCircle}
          title="Saved searches aren't connected"
          description="Start the CareerOS API and set NEXT_PUBLIC_API_URL to persist searches server-side."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const searches = data?.ok ? data.data.searches : [];

  if (searches.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Saved Searches"
          description="Searches persist on the backend so they survive a browser refresh."
        />
        <EmptyState
          icon={Bookmark}
          title="No saved searches yet"
          description="Save a search from the Discover Jobs page to reuse it here."
          action={
            <Button size="sm" onClick={() => router.push("/jobs")}>
              Discover Jobs
            </Button>
          }
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Saved Searches"
        description="Auto Search marks intent; Autopilot uses its own target queries until scheduled runs exist."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {searches.map((s) => (
          <div key={s.id} className="flex items-center gap-4 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground">{describe(s)}</div>
              <div className="mt-0.5 text-xs text-muted-foreground/70">
                {s.lastRunAt ? `Last run ${s.lastRunAt}` : "Never rerun"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={s.autoRerun}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                s.autoRerun
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              Auto Search {s.autoRerun ? "On" : "Off"}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Run now"
              onClick={() => {
                const q = (s.filters?.query as string) ?? "";
                router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
              }}
            >
              <Play className="size-3.5" strokeWidth={1.75} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete saved search"
              onClick={() => remove(s.id)}
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
