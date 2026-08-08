"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import { formatRelativeTime } from "@/lib/format";
import { pipelineColumns, type ApplicationRecord } from "@/types/application";

/**
 * Hand-rolled sortable table rather than TanStack Table: the installed
 * @tanstack/react-table v9 exposes a different API than the rest of this
 * codebase assumes, and ESLint's react-hooks/incompatible-library rule flags
 * useTable() as unsafe under React Compiler (returns non-memoizable
 * functions). Sorting requirements are simple enough that plain state is
 * clearer and fully typed.
 */

type SortKey = "company" | "rawFitScore" | "status" | "submittedAt";
type SortDir = "asc" | "desc";

const statusLabel = new Map(pipelineColumns.map((c) => [c.value, c.label]));
const statusOrder = new Map(pipelineColumns.map((c, i) => [c.value, i]));

function sortValue(app: ApplicationRecord, key: SortKey): string | number {
  switch (key) {
    case "company":
      return app.company.name.toLowerCase();
    case "rawFitScore":
      return app.rawFitScore;
    case "status":
      return statusOrder.get(app.status) ?? 0;
    case "submittedAt":
      return app.submittedAt ? new Date(app.submittedAt).getTime() : 0;
  }
}

function SortHeader({
  label,
  sortKeyValue,
  activeKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  activeKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKeyValue;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKeyValue)}
      className={`-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      <Icon className="size-3" strokeWidth={1.75} />
    </button>
  );
}

export function TableView({ applications }: { applications: ApplicationRecord[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = React.useState<SortKey>("rawFitScore");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "company" ? "asc" : "desc");
    }
  }

  const sorted = React.useMemo(() => {
    const copy = [...applications];
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [applications, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {(
              [
                { label: "Company", key: "company" },
                { label: "Fit", key: "rawFitScore" },
                { label: "Status", key: "status" },
                { label: "Submitted", key: "submittedAt" },
              ] as { label: string; key: SortKey }[]
            ).map((col) => (
              <TableHead
                key={col.key}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <SortHeader
                  label={col.label}
                  sortKeyValue={col.key}
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
              </TableHead>
            ))}
            <TableHead>Recruiter</TableHead>
            <TableHead>Next Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((app) => (
            <TableRow
              key={app.id}
              className="cursor-pointer"
              onClick={() => router.push(`/applications/${app.id}`)}
            >
              <TableCell>
                <div className="text-sm font-medium text-foreground">{app.company.name}</div>
                <div className="text-xs text-muted-foreground">{app.title}</div>
              </TableCell>
              <TableCell>
                <ScoreBadge score={app.rawFitScore} size="sm" showLabel={false} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {statusLabel.get(app.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {app.submittedAt ? formatRelativeTime(app.submittedAt) : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {app.recruiterName ?? "—"}
              </TableCell>
              <TableCell className="max-w-[220px] text-sm text-muted-foreground">
                {app.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
