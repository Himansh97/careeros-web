"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, BellRing, Clock, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isLiveApi } from "@/lib/api/client";
import { listFollowUps, setOutreachStatus } from "@/lib/api/ops";
import { formatRelativeTime } from "@/lib/format";

export default function FollowUpsPage() {
  const live = isLiveApi();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["follow-ups"],
    queryFn: listFollowUps,
    enabled: live,
  });

  async function markReplied(id: string) {
    const res = await setOutreachStatus(id, "replied");
    if (res.ok) {
      toast.success("Follow-up cancelled — they replied");
      qc.invalidateQueries({ queryKey: ["follow-ups"] });
      qc.invalidateQueries({ queryKey: ["outreach"] });
    }
  }

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Follow-ups" description="Scheduled after outreach is sent." />
        <EmptyState
          icon={AlertCircle}
          title="Follow-ups aren't connected"
          description="Start the CareerOS API and set NEXT_PUBLIC_API_URL."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const items = data?.ok ? data.data.followUps : [];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Follow-ups"
        description="Only outreach you marked as sent, with no reply recorded. Marking a reply cancels the follow-up automatically."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No follow-ups scheduled"
          description="A follow-up appears once you mark an outreach draft as sent on the Outreach page."
          className="flex-1"
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((f) => (
            <div key={f.id} className="flex items-center gap-4 px-4 py-3.5">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                  f.overdue ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Clock className="size-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {f.company} — {f.jobTitle}
                </div>
                <div className="text-xs text-muted-foreground">
                  Sent {f.sentAt ? formatRelativeTime(f.sentAt) : "—"}
                </div>
              </div>
              <Badge
                variant={f.overdue ? "outline" : "secondary"}
                className={f.overdue ? "border-primary/40 font-medium text-primary" : "font-normal"}
              >
                {f.overdue
                  ? "Due now"
                  : `Due ${new Date(f.followUpDueAt ?? "").toLocaleDateString()}`}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => markReplied(f.id)}>
                <CheckCheck className="size-3.5" strokeWidth={1.75} />
                They replied
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
