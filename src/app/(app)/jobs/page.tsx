"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, MapPin, SlidersHorizontal, Bookmark, Sparkles, AlertCircle } from "lucide-react";
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
import { searchJobs } from "@/lib/api/jobs";
import { saveSearch } from "@/lib/saved-searches";
import { createSavedSearch } from "@/lib/api/ops";
import { isLiveApi } from "@/lib/api/client";
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
  { value: "best_fit", label: "Best Fit" },
  { value: "newest", label: "Newest" },
  { value: "highest_salary", label: "Highest Salary" },
  { value: "recruiter_found", label: "Recruiter Found" },
];

function sortJobs(jobs: Job[], sort: JobSort): Job[] {
  const copy = [...jobs];
  switch (sort) {
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
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, Partial<Job>>>({});

  const filters: JobSearchFilters = {
    query: query || undefined,
    location: location || undefined,
    workArrangements: arrangements.length ? arrangements : undefined,
    minimumSalary: minSalary !== "any" ? Number(minSalary) : undefined,
    minimumFit: minFit !== "any" ? Number(minFit) : undefined,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs", "search", filters],
    queryFn: () => searchJobs(filters),
  });

  const notConnected = data?.ok === false && data.reason === "not_connected";
  const rawJobs = data?.ok ? data.data.jobs : [];
  const total = data?.ok ? data.data.total : 0;
  const scored = data?.ok ? (data.data.scored ?? data.data.jobs.length) : 0;
  const setAside = data?.ok ? (data.data.setAside ?? 0) : 0;
  const jobs = sortJobs(rawJobs, sort).map((j) => ({ ...j, ...localOverrides[j.id] }));

  function handleSelect(job: Job) {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      setSelectedJob(job);
    } else {
      router.push(`/jobs/${job.id}`);
    }
  }

  function handleToggleSave(job: Job) {
    const nextSaved = !job.saved;
    setLocalOverrides((prev) => ({ ...prev, [job.id]: { saved: nextSaved } }));
    toast.success(nextSaved ? "Job saved" : "Removed from saved");
  }

  function handleDismiss(job: Job) {
    setLocalOverrides((prev) => ({ ...prev, [job.id]: { dismissed: true } }));
    if (selectedJob?.id === job.id) setSelectedJob(null);
    toast("Job dismissed");
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

  const visibleJobs = jobs.filter((j) => !j.dismissed);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Discover Jobs"
        description="Live across Greenhouse, Ashby, The Muse, Arbeitnow and RemoteOK — scored against your real evidence."
      />

      {/* Search header */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input
            placeholder="Job title or skills"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
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
        <Button onClick={() => toast.info("Search updates live as you type/filter — nothing more to click.")}>
          <Search className="size-3.5" strokeWidth={1.75} />
          Search Jobs
        </Button>
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("More filters (ATS, industry, sponsorship, date posted) will land once discovery connects to real sources.")}
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
          More Filters
        </Button>

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

          {!isLoading && data?.ok && visibleJobs.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="CareerOS hasn't found a role matching these filters. Try widening your search."
            />
          )}

          {!isLoading &&
            visibleJobs.map((job) => (
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
