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
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ContactPanel } from "@/components/outreach/contact-panel";
import { mockContacts } from "@/lib/mock/outreach";
import { formatRelativeTime } from "@/lib/format";
import type { OutreachStatus, RecruiterContact } from "@/types/outreach";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const statusLabel: Record<OutreachStatus, string> = {
  not_started: "Not started",
  drafted: "Drafted",
  queued_manual: "Queued (manual)",
  sent: "Sent",
  replied: "Replied",
  no_response: "No response",
};

export default function OutreachPage() {
  const [selected, setSelected] = React.useState<RecruiterContact | null>(null);

  if (!isMockMode()) {
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
                    <Badge variant="secondary" className="font-normal">
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
    </div>
  );
}
