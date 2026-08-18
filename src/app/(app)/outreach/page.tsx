"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Send,
  Copy,
  Mail,
  CheckCheck,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
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

/**
 * Open this draft in Gmail, addressed, in the browser.
 *
 * The button used a `mailto:` URL, which hands the message to whatever the OS
 * has registered as the default mail handler. On this machine that is Apple
 * Mail, so every outreach draft was landing in an iCloud account the candidate
 * does not send job applications from — and they only noticed by finding the
 * copies there.
 *
 * The same line also omitted the recipient entirely (`mailto:?subject=...`),
 * so even in the right client the address had to be typed by hand from another
 * tab. Both are fixed here: Gmail's compose endpoint, with `to` filled in.
 */
function gmailComposeUrl(record: OutreachRecord): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: record.contactEmail ?? "",
    su: record.emailSubject ?? "",
    body: record.emailDraft ?? "",
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

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


  if (data && !data.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Recruiter Outreach" description="This page couldn't be loaded." />
        <EmptyState
          icon={AlertCircle}
          title="Couldn't reach the CareerOS API"
          description="Your drafts are still on the server. Start the backend on port 8000 and reload."
          className="flex-1"
        />
      </div>
    );
  }

  const records = data?.ok ? data.data.outreach : [];

  async function update(id: string, action: "sent" | "replied" | "unreplied") {
    const res = await setOutreachStatus(id, action);
    if (res.ok) {
      // "They replied" cancels the follow-up, so a mis-click silently drops the
      // reminder to chase someone who never answered. Offer the undo in the
      // same toast rather than making it unrecoverable.
      if (action === "replied") {
        toast.success("Marked as replied — follow-up cancelled", {
          action: { label: "Undo", onClick: () => void update(id, "unreplied") },
        });
      } else {
        toast.success(
          action === "sent"
            ? "Marked as sent — follow-up scheduled"
            : "Reply undone — follow-up restored from when you sent it"
        );
      }
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

                {/* Who this is actually going to.
                    The panel showed a draft with no addressee, so sending one
                    meant opening Contacts in another tab to find the address —
                    every time. The API now joins it; this shows it. */}
                {selected.contactName && (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium text-foreground">
                        {selected.contactName}
                      </span>
                      {selected.contactTitle && (
                        <span className="text-xs text-muted-foreground">
                          {selected.contactTitle}
                        </span>
                      )}
                    </div>
                    {selected.contactEmail && (
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <button
                          type="button"
                          className="font-mono text-xs text-foreground underline-offset-2 hover:underline"
                          onClick={() => {
                            navigator.clipboard?.writeText(selected.contactEmail ?? "");
                            toast.success("Email copied");
                          }}
                        >
                          {selected.contactEmail}
                        </button>
                        {/* An unverified address is worth knowing before you
                            send, not after it bounces. */}
                        {!selected.contactEmailVerified && (
                          <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning">
                            unverified
                          </span>
                        )}
                      </div>
                    )}
                    {selected.contactLinkedin && (
                      <a
                        href={selected.contactLinkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-info hover:underline"
                      >
                        <ExternalLink className="size-3" strokeWidth={1.75} />
                        LinkedIn profile
                      </a>
                    )}
                  </div>
                )}

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
                        onClick={() => window.open(gmailComposeUrl(selected), "_blank")}
                      >
                        <Mail className="size-3.5" strokeWidth={1.75} />
                        Open in Gmail
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
                    <Textarea readOnly value={selected.linkedinDraft} rows={5} className="mt-1 text-xs" />
                    {/* Copy and profile side by side: the two things you do
                        with a LinkedIn note, in the order you do them. Neither
                        existed here, so this panel could show you a note and
                        no way to act on it. */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard?.writeText(selected.linkedinDraft ?? "");
                          toast.success("LinkedIn note copied");
                        }}
                      >
                        <Copy className="size-3.5" strokeWidth={1.75} />
                        Copy note
                      </Button>
                      {selected.contactLinkedin && (
                        <Button size="sm" variant="outline" asChild>
                          <a
                            href={selected.contactLinkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="size-3.5" strokeWidth={1.75} />
                            Open profile
                          </a>
                        </Button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Send manually — no LinkedIn automation exists or is planned.
                      Connection notes are capped at 300 characters.
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
                  {/* Marking a thread replied cancels its follow-up, so a
                      mis-click drops the reminder to chase someone who never
                      answered — and nothing surfaces that afterwards. The way
                      back has to be visible on the record itself, not only in
                      a toast that has already gone. */}
                  {selected.status === "replied" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => update(selected.id, "unreplied")}
                    >
                      <RotateCcw className="size-3.5" strokeWidth={1.75} />
                      They didn&apos;t reply
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
