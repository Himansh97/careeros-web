"use client";

import * as React from "react";
import { AlertCircle, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ContactPanel } from "@/components/outreach/contact-panel";
import { mockContacts } from "@/lib/mock/outreach";
import { formatRelativeTime } from "@/lib/format";
import type { OutreachStatus, RecruiterContact } from "@/types/outreach";

// A data source exists if either the live backend or the mock layer is on.
const hasDataSource = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// LIVE_UNAVAILABLE: no live backend equivalent for this page yet.
const liveMode = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined;

const statusLabel: Record<OutreachStatus, string> = {
  not_started: "Not started",
  drafted: "Drafted",
  queued_manual: "Queued (manual)",
  sent: "Sent",
  replied: "Replied",
  no_response: "No response",
};

export default function OutreachPage() {
  // Hooks must run before any conditional return.
  const [selected, setSelected] = React.useState<RecruiterContact | null>(null);

  if (liveMode()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Recruiter Outreach" description="Connected to the live CareerOS API." />
        <EmptyState
          icon={AlertCircle}
          title="Not available on the live backend yet"
          description="Per-job outreach drafts are generated live from the Job Detail page. A cross-job recruiter list needs contact data the public job APIs don't expose."
          className="flex-1"
        />
      </div>
    );
  }

  if (!hasDataSource()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Recruiter Outreach"
          description="Recruiters CareerOS has identified, with personalized email and LinkedIn drafts."
        />
        <EmptyState
          icon={AlertCircle}
          title="Outreach isn't connected"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Recruiter Outreach"
        description="One contact per job. Emails need approval; LinkedIn messages are always manual."
      />

      <div className="flex flex-1 gap-5 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContacts.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  data-state={selected?.id === c.id ? "selected" : undefined}
                  onClick={() => setSelected(c)}
                >
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.title}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.companyName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.jobTitle}</TableCell>
                  <TableCell className="text-sm tabular-nums text-foreground">{c.confidence}%</TableCell>
                  <TableCell className="text-sm capitalize text-muted-foreground">{c.channel}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "replied" ? "outline" : "secondary"}
                      className={
                        c.status === "replied"
                          ? "border-primary/30 bg-primary/10 font-medium text-primary"
                          : "font-normal"
                      }
                    >
                      {statusLabel[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.lastContactAt ? formatRelativeTime(c.lastContactAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Desktop: side panel */}
        <div className="hidden w-[360px] shrink-0 xl:block">
          {selected ? (
            <ContactPanel contact={selected} />
          ) : (
            <EmptyState
              icon={Send}
              title="Select a contact"
              description="Choose a recruiter to see why they were selected and review the drafted outreach."
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Below xl: same panel as a drawer, so selecting a row still does something */}
      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md xl:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{selected?.name ?? "Contact"}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="p-4">
              <ContactPanel contact={selected} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
