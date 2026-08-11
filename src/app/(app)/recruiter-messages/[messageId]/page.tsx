"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  MailCheck,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DraftReview } from "@/components/recruiter-messages/draft-review";
import { EmptyState } from "@/components/empty-state";
import { getRecruiterMessage } from "@/lib/api/recruiter-messages";

function titleCase(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RecruiterMessageDetailPage() {
  const { messageId: encodedMessageId } = useParams<{ messageId: string }>();
  let messageId = encodedMessageId;
  try {
    messageId = decodeURIComponent(encodedMessageId);
  } catch {
    // Keep the literal segment so malformed direct URLs reach the normal
    // not-found state instead of crashing the page.
  }
  const messageQuery = useQuery({
    queryKey: ["recruiter-messages", "detail", messageId],
    queryFn: () => getRecruiterMessage(messageId),
    enabled: Boolean(messageId),
  });

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="w-fit -ml-2">
      <Link href="/recruiter-messages">
        <ArrowLeft />
        Recruiter messages
      </Link>
    </Button>
  );

  if (messageQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-5" aria-label="Loading recruiter message" aria-busy="true">
        {backLink}
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="mt-3 h-4 w-48" />
          <Skeleton className="mt-5 h-16 w-full" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-5 h-8 w-full" />
          <Skeleton className="mt-4 h-8 w-full" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
      </div>
    );
  }

  const notConnected =
    messageQuery.data?.ok === false && messageQuery.data.reason === "not_connected";
  const notFound = messageQuery.data?.ok === false && messageQuery.data.reason === "not_found";
  const loadFailed =
    messageQuery.isError ||
    (messageQuery.data?.ok === false && messageQuery.data.reason === "error");

  if (notConnected || notFound || loadFailed || !messageQuery.data?.ok) {
    return (
      <div className="flex flex-1 flex-col gap-5">
        {backLink}
        <EmptyState
          icon={notFound ? MailCheck : AlertCircle}
          title={
            notFound
              ? "Recruiter message not found"
              : notConnected
                ? "Recruiter messages aren't connected"
                : "This recruiter message couldn't load"
          }
          description={
            notFound
              ? "It may have been removed or the Gmail message link may be out of date."
              : notConnected
                ? "Start the CareerOS API and confirm NEXT_PUBLIC_API_URL is set."
                : "Try the connection again in a moment."
          }
          action={
            !notFound && !notConnected ? (
              <Button variant="outline" onClick={() => void messageQuery.refetch()}>
                <RefreshCw />
                Try again
              </Button>
            ) : undefined
          }
          className="flex-1"
        />
      </div>
    );
  }

  const message = messageQuery.data.data;
  const received = new Date(message.receivedAt);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {backLink}

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{titleCase(message.classification)}</Badge>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" strokeWidth={1.75} />
                <time dateTime={message.receivedAt}>
                  {Number.isNaN(received.getTime()) ? message.receivedAt : received.toLocaleString()}
                </time>
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {message.subject}
            </h1>
            <p className="mt-2 inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <UserRound className="size-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">
                {message.senderName || message.senderEmail}
                {message.senderName && ` · ${message.senderEmail}`}
              </span>
            </p>
          </div>
          {message.applicationId && (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href={`/applications/${encodeURIComponent(message.applicationId)}`}>
                View application
              </Link>
            </Button>
          )}
        </div>
        <div className="mt-5 rounded-lg bg-muted/50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Message synopsis
          </div>
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">{message.synopsis}</p>
        </div>
      </section>

      <DraftReview
        key={message.draft?.updatedAt ?? "no-draft"}
        message={message}
        onRefetch={messageQuery.refetch}
      />
    </div>
  );
}
