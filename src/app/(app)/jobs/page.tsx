"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, MapPin, Bookmark, Sparkles, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { JobCard } from "@/components/job-card";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { ImportByUrl } from "@/components/jobs/import-by-url";
import { searchJobs, refreshJobs } from "@/lib/api/jobs";
import { saveSearch } from "@/lib/saved-searches";
import { createSavedSearch } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";
import { useJobFlags } from "@/lib/hooks/use-job-flags";
import { useDebounced } from "@/lib/hooks/use-debounced";
import type { Job, JobSearchFilters, JobSort, WorkArrangement } from "@/types/job";

const salaryOptions = [
  { value: "any", label: "Any salary" },
  { value: "80000", label: "$80K+" },
  { value: "100000", label: "$100K+" },
  { value: "120000", label: "$120K+" },
  { value: "150000", label: "$150K+" },
  { value: "180000", label: "$180K+" },
];

const fitOptions = [
  { value: "any", label: "Any fit" },
  { value: "60", label: "60+ Partial" },
  { value: "70", label: "70+ Good" },
  { value: "80", label: "80+ Strong" },
  { value: "90", label: "90+ Excellent" },
];

const sortOptions: { value: JobSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "priority", label: "Worth doing next" },
  { value: "best_fit", label: "Best Fit" },
  { value: "newest", label: "Newest" },
  { value: "highest_salary", label: "Highest Salary" },
  { value: "recruiter_found", label: "Recruiter Found" },
];

function sortJobs(jobs: Job[], sort: JobSort): Job[] {
  const copy = [...jobs];
  switch (sort) {
    case "priority":
      // Fit says where you are strongest; this says where the next twenty
      // minutes go furthest — posting age and application effort included.
      return copy.sort(
        (a, b) => (b.priority?.score ?? 0) - (a.priority?.score ?? 0)
      );
    case "best_fit":
      return copy.sort((a, b) => (b.rawFitScore ?? 0) - (a.rawFitScore ?? 0));
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime()
      );
    case "highest_salary":
      return copy.sort((a, b) => (b.salary?.max ?? 0) - (a.salary?.max ?? 0));
    case "recruiter_found":
      return copy.sort((a, b) =>
        (b.recruiterStatus === "found" ? 1 : 0) - (a.recruiterStatus === "found" ? 1 : 0)
      );
    case "recommended":
    default:
      return copy.sort((a, b) => (b.rawFitScore ?? 0) - (a.rawFitScore ?? 0));
  }
}

export default function JobsPage() {
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [arrangements, setArrangements] = React.useState<WorkArrangement[]>([]);
  const [minSalary, setMinSalary] = React.useState("any");
  const [minFit, setMinFit] = React.useState("any");
  const [sort, setSort] = React.useState<JobSort>("recommended");
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  // "Where did this come from" is a different question from any server-side
  // filter, and cheap to answer on the client: origin ships with every row.
  const [origin, setOrigin] = React.useState<"all" | "pasted" | "fetched">("all");
  const [refreshing, setRefreshing] = React.useState(false);
  const { toggleSave, dismiss } = useJobFlags();
  const queryClient = useQueryClient();

  async function handleRefresh() {
    setRefreshing(true);
    const res = await refreshJobs();
    setRefreshing(false);
    if (!res.ok) {
      toast.error("Couldn't refresh", {
        description:
          res.reason === "not_connected"
            ? "The CareerOS API isn't reachable — start it on port 8000."
            : "The sources could not be re-polled.",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    const { total, unitedStates, failed } = res.data;
    toast.success(`Re-polled every source — ${unitedStates.toLocaleString()} US roles`, {
      description:
        failed.length > 0
          ? `${total.toLocaleString()} found. ${failed.length} source(s) failed: ${failed.join(", ")}`
          : `${total.toLocaleString()} found across all sources.`,
    });
  }

  // Only the free-text boxes are debounced. The toggles and selects are single
  // deliberate clicks, so making the user wait 300ms for those would be worse.
  const debouncedQuery = useDebounced(query);
  const debouncedLocation = useDebounced(location);

  const filters: JobSearchFilters = React.useMemo(
    () => ({
      query: debouncedQuery || undefined,
      location: debouncedLocation || undefined,
      workArrangements: arrangements.length ? arrangements : undefined,
      minimumSalary: minSalary !== "any" ? Number(minSalary) : undefined,
      minimumFit: minFit !== "any" ? Number(minFit) : undefined,
    }),
    [debouncedQuery, debouncedLocation, arrangements, minSalary, minFit]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["jobs", "search", filters],
    queryFn: () => searchJobs(filters),
  });

  const notConnected = data?.ok === false && data.reason === "not_connected";
  const rawJobs = data?.ok ? data.data.jobs : [];
  const total = data?.ok ? data.data.total : 0;
  const scored = data?.ok ? (data.data.scored ?? data.data.jobs.length) : 0;
  const setAside = data?.ok ? (data.data.setAside ?? 0) : 0;
  // The backend already drops dismissed postings before scoring; this catches
  // the optimistic window between the click and the refetch.
  const jobs = sortJobs(rawJobs, sort)
    .filter((j) => !j.dismissed)
    .filter((j) => origin === "all" || (j.origin ?? "fetched") === origin);
  const pastedCount = rawJobs.filter((j) => j.origin === "pasted" && !j.dismissed).length;

  function handleSelect(job: Job) {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      setSelectedJob(job);
    } else {
      router.push(`/jobs/${job.id}`);
    }
  }

  function handleToggleSave(job: Job) {
    void toggleSave(job);
  }

  function handleDismiss(job: Job) {
    if (selectedJob?.id === job.id) setSelectedJob(null);
    void dismiss(job);
  }

  function handleSaveSearch() {
    const label = query || location || "New search";
    if (isLiveApi()) {
      // Persist server-side so a saved search survives clearing the browser.
      void createSavedSearch(label, filters as Record<string, unknown>);
    } else {
      saveSearch(label, filters);
    }
    toast.success(`Saved search "${label}"`, {
      description: "Find it under Saved Searches in the sidebar.",
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Discover Jobs"
        description="Live across Greenhouse, Ashby, Lever, Workday, SmartRecruiters, The Muse, Arbeitnow and RemoteOK — scored against your real evidence."
        action={
          /* Discovery is lazy and cached for 15 minutes, so the pool only moved
             when the 07:00 job ran or someone opened the app. This is the "look
             again now" that was missing. It fetches only — nothing is scored,
             tailored or queued. */
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
            {refreshing ? "Fetching…" : "Fetch now"}
          </Button>
        }
      />

      {/* Paste a link to any posting, including boards we don't poll. */}
      <ImportByUrl />

      {/* Search header */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Job title or skills"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-8"
          />
          {/* The search now waits for typing to settle, so say when it fires —
              otherwise the pause reads as the box being broken. */}
          {isFetching && (
            <Loader2
              className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              strokeWidth={1.75}
            />
          )}
        </div>
        <div className="relative sm:w-64">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Location or 'remote'"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="multiple"
          size="sm"
          variant="outline"
          value={arrangements}
          onValueChange={(v) => setArrangements(v as WorkArrangement[])}
        >
          <ToggleGroupItem value="remote">Remote</ToggleGroupItem>
          <ToggleGroupItem value="hybrid">Hybrid</ToggleGroupItem>
          <ToggleGroupItem value="onsite">On-site</ToggleGroupItem>
        </ToggleGroup>

        <Select value={minSalary} onValueChange={setMinSalary}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {salaryOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minFit} onValueChange={setMinFit}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fitOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Jobs you added vs jobs discovery found. Only shown once something
            pasted actually exists, so it never appears as a dead control. */}
        {pastedCount > 0 && (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={origin}
            onValueChange={(v) => v && setOrigin(v as "all" | "pasted" | "fetched")}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="pasted">Pasted ({pastedCount})</ToggleGroupItem>
            <ToggleGroupItem value="fetched">Auto-fetched</ToggleGroupItem>
          </ToggleGroup>
        )}

        <Button variant="outline" size="sm" onClick={handleSaveSearch}>
          <Bookmark className="size-3.5" strokeWidth={1.75} />
          Save Search
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort</span>
          <Select value={sort} onValueChange={(v) => setSort(v as JobSort)}>
            <SelectTrigger size="sm" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results + detail panel */}
      <div className="flex flex-1 gap-5 overflow-hidden">
        <div className="flex w-full flex-col gap-2 overflow-y-auto lg:w-[420px] lg:shrink-0">
          {!isLoading && !notConnected && jobs.length > 0 && (
            <p className="px-1 text-xs text-muted-foreground">
              Showing {jobs.length} of {scored.toLocaleString()} scored
              {setAside > 0 && (
                <>
                  {" "}
                  · {setAside.toLocaleString()} of {total.toLocaleString()} not scored
                  <span
                    title="Scoring reads each full job description, so the least relevant titles are set aside rather than scored. Narrow your search to pull more of the pool into scoring."
                    className="ml-1 cursor-help underline decoration-dotted"
                  >
                    why?
                  </span>
                </>
              )}
            </p>
          )}

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3.5">
                  <Skeleton className="size-9 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && notConnected && (
            <EmptyState
              icon={AlertCircle}
              title="Job discovery isn't connected"
              description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with realistic mock data, or connect a real search backend."
            />
          )}

          {!isLoading && isError && (
            <EmptyState
              icon={AlertCircle}
              title="Search failed"
              description="Something went wrong reaching the job search provider. Try again in a moment."
            />
          )}

          {!isLoading && data?.ok && jobs.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="CareerOS hasn't found a role matching these filters. Try widening your search."
            />
          )}

          {!isLoading &&
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selectedJob?.id === job.id}
                onSelect={handleSelect}
                onToggleSave={handleToggleSave}
                onDismiss={handleDismiss}
              />
            ))}
        </div>

        <div className="hidden flex-1 overflow-y-auto lg:block">
          {selectedJob ? (
            <JobDetailPanel job={selectedJob} />
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Select a job"
              description="Choose a role from the list to see why CareerOS thinks it's a match."
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
