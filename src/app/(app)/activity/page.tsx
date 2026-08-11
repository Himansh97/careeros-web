"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Activity as ActivityIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  subscribeApplications,
  getApplicationsSnapshot,
  getApplicationsLoadState,
} from "@/lib/api/applications";
import { formatRelativeTime } from "@/lib/format";
import type { ApplicationRecord } from "@/types/application";

// A data source exists if either the live backend or the mock layer is on.
const hasDataSource = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function ActivityPage() {
  const apps = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    () => [] as ApplicationRecord[]
  );
  // An audit log that silently shows nothing when it cannot be read is worse
  // than one that says it cannot be read.
  const loadState = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsLoadState,
    () => "loading" as const
  );

  if (hasDataSource() && loadState === "loading") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Activity" description="Timestamped audit log." />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (hasDataSource() && loadState === "error") {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Activity" description="The audit log couldn't be loaded." />
        <EmptyState
          icon={AlertCircle}
          title="Couldn't reach the CareerOS API"
          description="This is not an empty log — it could not be read. Start the backend on port 8000 and reload."
          className="flex-1"
        />
      </div>
    );
  }

  if (!hasDataSource()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Activity"
          description="A full, timestamped audit log of every action CareerOS takes on your behalf."
        />
        <EmptyState
          icon={AlertCircle}
          title="No activity yet"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      </div>
    );
  }

  // Flatten every application's timeline into one reverse-chronological feed.
  const events = apps
    .flatMap((app) =>
      app.timeline.map((e) => ({
        ...e,
        appId: app.id,
        company: app.company.name,
        role: app.title,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (events.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Activity" description="Timestamped audit log." />
        <EmptyState
          icon={ActivityIcon}
          title="No activity yet"
          description="Every discovery run, tailoring pass, and outreach draft will be logged here, in order."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Activity"
        description={`${events.length} events across ${apps.length} applications, newest first.`}
      />
      <div className="rounded-lg border border-border bg-card">
        <ol className="divide-y divide-border">
          {events.map((event) => (
            <li key={`${event.appId}-${event.id}`} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{event.label}</p>
                <p className="text-xs text-muted-foreground">
                  <Link href={`/applications/${event.appId}`} className="hover:underline">
                    {event.role} · {event.company}
                  </Link>
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeTime(event.timestamp)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
