"use client";

import * as React from "react";
import { AlertCircle, Briefcase, LayoutGrid, Table2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { BoardView } from "@/components/applications/board-view";
import { TableView } from "@/components/applications/table-view";
import { subscribeApplications, getApplicationsSnapshot } from "@/lib/api/applications";
import type { ApplicationRecord } from "@/types/application";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function ApplicationsPage() {
  const [view, setView] = React.useState<"board" | "table">("board");
  const applications = React.useSyncExternalStore(
    subscribeApplications,
    getApplicationsSnapshot,
    () => [] as ApplicationRecord[]
  );

  if (!isMockMode()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Applications"
          description="Track every application from qualified through offer, in board or table view."
        />
        <EmptyState
          icon={AlertCircle}
          title="Applications aren't connected"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Applications"
          description="Track every application from qualified through offer, in board or table view."
        />
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="The strongest jobs you approve for tailoring will show up here as they move through the pipeline."
          className="flex-1"
        />
      </div>
    );
  }

  const inProgress = applications.filter(
    (a) => a.status !== "rejected" && a.status !== "offer"
  ).length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const offers = applications.filter((a) => a.status === "offer").length;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Applications"
        description="Track every application from qualified through offer."
        action={
          <ToggleGroup type="single" size="sm" variant="outline" value={view} onValueChange={(v) => v && setView(v as "board" | "table")}>
            <ToggleGroupItem value="board" aria-label="Board view">
              <LayoutGrid className="size-3.5" strokeWidth={1.75} />
              Board
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table2 className="size-3.5" strokeWidth={1.75} />
              Table
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Total" value={applications.length} />
        <MetricCard label="In progress" value={inProgress} />
        <MetricCard label="Interviews" value={interviews} />
        <MetricCard label="Offers" value={offers} />
      </div>

      {view === "board" ? (
        <BoardView applications={applications} />
      ) : (
        <TableView applications={applications} />
      )}
    </div>
  );
}
