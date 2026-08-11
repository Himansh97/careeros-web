import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Mail,
  UserRound,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type {
  RecruiterDraftStatus,
  RecruiterMessage,
} from "@/types/recruiter-message";

interface MessageCardProps {
  message: RecruiterMessage;
  company?: string;
  role?: string;
  applicationLookupState?: "loading" | "unavailable" | "missing";
}

const statusDetails: Record<
  RecruiterDraftStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  awaiting_approval: {
    label: "Awaiting approval",
    className: "border-warning/30 bg-warning/10 text-warning",
    icon: Clock3,
  },
  approved: {
    label: "Approved",
    className: "border-info/30 bg-info/10 text-info",
    icon: FileCheck2,
  },
  creating: {
    label: "Creating draft",
    className: "border-info/30 bg-info/10 text-info",
    icon: Clock3,
  },
  created: {
    label: "Draft ready",
    className: "border-success/30 bg-success/10 text-success",
    icon: CheckCircle2,
  },
  dismissed: {
    label: "Dismissed",
    className: "border-border bg-muted text-muted-foreground",
    icon: XCircle,
  },
  failed: {
    label: "Creation failed",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
};

function titleCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function MessageCard({
  message,
  company,
  role,
  applicationLookupState,
}: MessageCardProps) {
  // Sending outranks the draft status. Once a reply has gone out, "Awaiting
  // approval" is not merely stale — it invites the candidate to send twice.
  const sentAt = message.draft?.sentAt ?? null;
  const status = sentAt
    ? { label: "Replied", className: "border-success/30 bg-success/10 text-success", icon: CheckCircle2 }
    : message.draft
      ? statusDetails[message.draft.status]
      : null;
  const StatusIcon = status?.icon ?? Mail;
  const received = new Date(message.receivedAt);
  const hasLinkedApplication = message.applicationId !== null;
  const applicationContext = !hasLinkedApplication
    ? { company: "Unmatched application", role: "No linked role" }
    : applicationLookupState === "missing"
      ? { company: "Linked application not found", role: "Role details unavailable" }
      : { company: "Application details unavailable", role: "Role details unavailable" };

  return (
    <Link
      href={`/recruiter-messages/${encodeURIComponent(message.gmailMessageId)}`}
      aria-label={`Review recruiter message from ${message.senderName || message.senderEmail}: ${message.subject}`}
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {hasLinkedApplication && applicationLookupState === "loading" ? (
            <div
              className="flex items-center gap-2"
              aria-label="Loading linked application details"
              aria-busy="true"
            >
              <Skeleton className="h-4 w-32" />
              <span className="text-muted-foreground" aria-hidden="true">·</span>
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-foreground">
                {company ?? applicationContext.company}
              </span>
              <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="text-sm text-muted-foreground">
                {role ?? applicationContext.role}
              </span>
            </div>
          )}
          <h2 className="line-clamp-2 text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
            {message.subject}
          </h2>
        </div>

        <Badge
          variant="outline"
          className={cn("shrink-0 gap-1.5", status?.className)}
        >
          <StatusIcon className="size-3" strokeWidth={1.9} />
          {status?.label ?? "No draft"}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">
            {message.senderName || message.senderEmail}
            {message.senderName && (
              <span className="text-muted-foreground/75"> · {message.senderEmail}</span>
            )}
          </span>
        </span>
        <time
          dateTime={message.receivedAt}
          title={Number.isNaN(received.getTime()) ? message.receivedAt : received.toLocaleString()}
          className="inline-flex items-center gap-1.5"
        >
          <Clock3 className="size-3.5" strokeWidth={1.75} />
          {formatRelativeTime(message.receivedAt)}
        </time>
        <Badge variant="outline" className="h-5 font-normal text-muted-foreground">
          {titleCase(message.classification)}
        </Badge>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {message.synopsis}
      </p>
    </Link>
  );
}
