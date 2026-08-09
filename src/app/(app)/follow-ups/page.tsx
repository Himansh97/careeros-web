"use client";

import { AlertCircle, BellRing, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { mockContacts } from "@/lib/mock/outreach";
import { formatRelativeTime } from "@/lib/format";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function FollowUpsPage() {
  if (!isMockMode()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Follow-ups"
          description="Scheduled follow-ups after recruiter outreach, timed and tracked automatically."
        />
        <EmptyState
          icon={AlertCircle}
          title="Follow-ups aren't connected"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      </div>
    );
  }

  // Only contacts that were actually contacted and haven't replied are eligible —
  // following up after a reply, or before any contact, would be wrong.
  const scheduled = mockContacts.filter(
    (c) => c.followUpDueAt && c.status === "sent"
  );

  if (scheduled.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Follow-ups" description="Nothing scheduled." />
        <EmptyState
          icon={BellRing}
          title="No follow-ups scheduled"
          description="Follow-ups are scheduled a few business days after outreach is sent — and skipped entirely once a recruiter replies."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Follow-ups"
        description="Scheduled only for outreach that was sent and hasn't received a reply."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {scheduled.map((c) => (
          <div key={c.id} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Clock className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">
                {c.name} · {c.companyName}
              </div>
              <div className="text-xs text-muted-foreground">
                {c.jobTitle} — first contacted{" "}
                {c.lastContactAt ? formatRelativeTime(c.lastContactAt) : "—"}
              </div>
            </div>
            <Badge variant="secondary" className="font-normal">
              Due {c.followUpDueAt ? new Date(c.followUpDueAt).toLocaleDateString() : "—"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
