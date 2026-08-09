"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Send, Copy, Mail, CheckCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { isLiveApi } from "@/lib/api/client";
import { listOutreach, setOutreachStatus, type OutreachRecord } from "@/lib/api/ops";
import { formatRelativeTime } from "@/lib/format";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const statusStyle: Record<string, string> = {
  drafted: "",
  sent: "border-primary/30 bg-primary/10 text-primary",
  replied: "border-primary/40 bg-primary/15 font-medium text-primary",
};

export default function OutreachPage() {
  const live = isLiveApi();
  const qc = useQueryClient();
  const [selected, setSelected] = React.useState<OutreachRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["outreach"],
    queryFn: listOutreach,
    enabled: live,
  });

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Recruiter Outreach" description="Drafted messages per job." />
        <EmptyState
          icon={AlertCircle}
          title={isMockMode() ? "Mock mode" : "Outreach isn't connected"}
          description="Start the CareerOS API and set NEXT_PUBLIC_API_URL to see real outreach drafts."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const records = data?.ok ? data.data.outreach : [];

  async function update(id: string, action: "sent" | "replied") {
    const res = await setOutreachStatus(id, action);
    if (res.ok) {
      toast.success(
        action === "sent"
          ? "Marked as sent — follow-up scheduled"
          : "Marked as replied — follow-up cancelled"
      );
      qc.invalidateQueries({ queryKey: ["outreach"] });
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
      setSelected(null);
    } else {
      toast.error("Couldn't update status");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeader
        title="Recruiter Outreach"
        description="Drafts are generated from your real evidence. Nothing sends automatically — you send, then mark it here."
      />

      {records.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No outreach drafted yet"
          description="Open a job and use Prepare Outreach on its Recruiter tab to generate a draft."
          className="flex-1"
        />
      ) : (
        <div className="flex flex-1 gap-5 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    data-state={selected?.id === r.id ? "selected" : undefined}
                    onClick={() => setSelected(r)}
                  >
                    <TableCell className="text-sm font-medium text-foreground">
                      {r.company}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.jobTitle}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "drafted" ? "secondary" : "outline"}
                        className={statusStyle[r.status] ?? ""}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.sentAt ? formatRelativeTime(r.sentAt) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.repliedAt
                        ? "cancelled (replied)"
                        : r.followUpDueAt
                          ? new Date(r.followUpDueAt).toLocaleDateString()
                          : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="hidden w-[380px] shrink-0 xl:block">
            {selected ? (
              <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{selected.company}</h2>
                  <p className="text-xs text-muted-foreground">{selected.jobTitle}</p>
                </div>

                {selected.emailSubject && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Subject
                    </span>
                    <p className="text-sm text-foreground">{selected.emailSubject}</p>
                  </div>
                )}

                {selected.emailDraft && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Email draft
                    </span>
                    <Textarea readOnly value={selected.emailDraft} rows={11} className="mt-1 text-xs" />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const url = `mailto:?subject=${encodeURIComponent(selected.emailSubject ?? "")}&body=${encodeURIComponent(selected.emailDraft ?? "")}`;
                          window.location.href = url;
                        }}
                      >
                        <Mail className="size-3.5" strokeWidth={1.75} />
                        Open in mail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard?.writeText(selected.emailDraft ?? "");
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="size-3.5" strokeWidth={1.75} />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                {selected.linkedinDraft && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      LinkedIn draft
                    </span>
                    <Textarea readOnly value={selected.linkedinDraft} rows={4} className="mt-1 text-xs" />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Send manually — no LinkedIn automation exists or is planned.
                    </p>
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-3">
                  {selected.status === "drafted" && (
                    <Button size="sm" variant="outline" onClick={() => update(selected.id, "sent")}>
                      <CheckCheck className="size-3.5" strokeWidth={1.75} />
                      I sent this
                    </Button>
                  )}
                  {selected.status === "sent" && (
                    <Button size="sm" onClick={() => update(selected.id, "replied")}>
                      <CheckCheck className="size-3.5" strokeWidth={1.75} />
                      They replied
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Send}
                title="Select a draft"
                description="Choose a row to read the message and update its status."
                className="h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
