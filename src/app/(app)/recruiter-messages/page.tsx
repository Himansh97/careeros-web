"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, MailCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { MessageCard } from "@/components/recruiter-messages/message-card";
import { PageHeader } from "@/components/page-header";
import { listApplications } from "@/lib/api/applications";
import { listRecruiterMessages } from "@/lib/api/recruiter-messages";

export default function RecruiterMessagesPage() {
  const applicationId: string | undefined = undefined;
  const messagesQuery = useQuery({
    queryKey: ["recruiter-messages", applicationId ?? "all"],
    queryFn: () => listRecruiterMessages(applicationId),
  });
  const applicationsQuery = useQuery({
    queryKey: ["applications", "recruiter-message-context"],
    queryFn: listApplications,
  });

  const messages = messagesQuery.data?.ok ? messagesQuery.data.data : [];
  const applications = applicationsQuery.data?.ok ? applicationsQuery.data.data : [];
  const applicationById = new Map(applications.map((application) => [application.id, application]));
  const notConnected =
    messagesQuery.data?.ok === false && messagesQuery.data.reason === "not_connected";
  const loadFailed =
    messagesQuery.isError ||
    (messagesQuery.data?.ok === false && messagesQuery.data.reason !== "not_connected");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Recruiter Messages"
        description="Recruiter replies and suggested responses, ready for your review. Nothing sends automatically."
      />

      {messagesQuery.isLoading && (
        <div className="space-y-3" aria-label="Loading recruiter messages" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <Skeleton className="h-5 w-72 max-w-[85%]" />
                </div>
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <div className="mt-4 flex gap-3">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!messagesQuery.isLoading && notConnected && (
        <EmptyState
          icon={AlertCircle}
          title="Recruiter messages aren't connected"
          description="Start the CareerOS API and confirm NEXT_PUBLIC_API_URL is set. Recruiter messages are never replaced with sample data."
          className="flex-1"
        />
      )}

      {!messagesQuery.isLoading && loadFailed && (
        <EmptyState
          icon={AlertCircle}
          title="Recruiter messages couldn't load"
          description="The inbox is still here. Try the connection again in a moment."
          action={
            <Button variant="outline" onClick={() => void messagesQuery.refetch()}>
              <RefreshCw />
              Try again
            </Button>
          }
          className="flex-1"
        />
      )}

      {!messagesQuery.isLoading && messagesQuery.data?.ok && messages.length === 0 && (
        <EmptyState
          icon={MailCheck}
          title="No recruiter messages yet"
          description="When CareerOS confidently matches a recruiter reply, it will appear here with a suggested response to review."
          className="flex-1"
        />
      )}

      {!messagesQuery.isLoading && messages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {messages.length} message{messages.length === 1 ? "" : "s"}, newest first
          </p>
          {messages.map((message) => {
            const application = message.applicationId
              ? applicationById.get(message.applicationId)
              : undefined;
            return (
              <MessageCard
                key={message.gmailMessageId}
                message={message}
                company={application?.company.name}
                role={application?.title}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
