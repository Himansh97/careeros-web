"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import {
  subscribeSavedSearches,
  getSavedSearchesSnapshot,
  removeSavedSearch,
  toggleAutoRerun,
  type SavedSearch,
} from "@/lib/saved-searches";

function describeFilters(search: SavedSearch): string {
  const parts: string[] = [];
  if (search.filters.query) parts.push(search.filters.query);
  if (search.filters.location) parts.push(search.filters.location);
  if (search.filters.workArrangements?.length) parts.push(search.filters.workArrangements.join("/"));
  if (search.filters.minimumSalary) parts.push(`$${search.filters.minimumSalary / 1000}K+`);
  return parts.length ? parts.join(" · ") : "All jobs";
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const searches = React.useSyncExternalStore(
    subscribeSavedSearches,
    getSavedSearchesSnapshot,
    () => [] as SavedSearch[]
  );

  function handleRemove(id: string) {
    removeSavedSearch(id);
    toast("Saved search removed");
  }

  function handleToggleAuto(id: string) {
    toggleAutoRerun(id);
  }

  if (searches.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Saved Searches"
          description="Searches you save can automatically rerun and surface new matches."
        />
        <EmptyState
          icon={Bookmark}
          title="No saved searches yet"
          description="Save a search from the Discover Jobs page to have CareerOS rerun it automatically."
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
        description="Auto Search reruns require automation to be connected — for now, toggling it just marks intent."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {searches.map((search) => (
          <div key={search.id} className="flex items-center gap-4 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{search.label}</div>
              <div className="text-xs text-muted-foreground">{describeFilters(search)}</div>
              <div className="mt-0.5 text-xs text-muted-foreground/70">
                {search.lastRunAt ? `Last run ${search.lastRunAt}` : "Never rerun"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAuto(search.id)}
              aria-pressed={search.autoRerun}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                search.autoRerun
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              Auto Search {search.autoRerun ? "On" : "Off"}
            </button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push("/jobs")} aria-label="Run now">
              <Play className="size-3.5" strokeWidth={1.75} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(search.id)}
              aria-label="Delete saved search"
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
