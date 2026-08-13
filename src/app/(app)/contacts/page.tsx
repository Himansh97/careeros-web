"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Link2,
  Users,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listContacts } from "@/lib/api/contacts";
import { isLiveApi } from "@/lib/api/client";
import { mockContacts } from "@/lib/mock/outreach";
import { Stagger } from "@/components/motion/primitives";

// A data source exists if either the live backend or the mock layer is on.
const hasDataSource = () =>
  process.env.NEXT_PUBLIC_API_URL !== "" && process.env.NEXT_PUBLIC_API_URL !== undefined
    ? true
    : process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function ContactsPage() {
  const live = isLiveApi();
  const { data, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: listContacts,
    enabled: live,
  });

  if (live) {
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
          <PageHeader title="Contacts" description="This page couldn't be loaded." />
          <EmptyState
            icon={AlertCircle}
            title="Couldn't reach the CareerOS API"
            description="Your contacts are still on the server. Start the backend on port 8000 and reload."
            className="flex-1"
          />
        </div>
      );
    }

    const contacts = data?.ok ? data.data.contacts : [];
    const lookupEnabled = data?.ok ? data.data.lookupEnabled : false;

    return (
      <div className="flex flex-1 flex-col gap-5">
        <PageHeader
          title="Contacts"
          description="Nothing here is guessed — contacts come from Hunter.io's verified index or your own manual entry."
        />

        {!lookupEnabled && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <div className="text-sm">
              <p className="font-medium text-foreground">Automatic lookup is off</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add a free Hunter.io key as{" "}
                <code className="rounded bg-muted px-1">HUNTER_API_KEY</code> on the API to
                look contacts up automatically (25 searches/month, no card). Manual entry
                works regardless.
              </p>
            </div>
          </div>
        )}

        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts saved yet"
            description="Open a job and use its Recruiter tab to look up or manually add a contact."
            className="flex-1"
          />
        ) : (
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-foreground">{c.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                  </div>
                  {c.confidence > 0 && (
                    <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                      {c.confidence}%
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {c.email ? (
                    <Badge variant="secondary" className="gap-1 font-normal">
                      {c.emailVerified ? (
                        <ShieldCheck className="size-3 text-primary" strokeWidth={2} />
                      ) : (
                        <ShieldAlert className="size-3" strokeWidth={2} />
                      )}
                      {c.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-normal">No email</Badge>
                  )}
                  <Badge variant="secondary" className="font-normal">via {c.provider}</Badge>
                  {c.linkedinUrl && (
                    <a
                      href={c.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link2 className="size-3" strokeWidth={1.75} />
                      LinkedIn
                    </a>
                  )}
                </div>
                {c.email && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">{c.email}</p>
                )}
                {c.whySelected && (
                  <p className="mt-1 text-xs text-muted-foreground/80">{c.whySelected}</p>
                )}
              </div>
            ))}
          </Stagger>
        )}
      </div>
    );
  }

  if (!hasDataSource()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Contacts"
          description="Every recruiter and hiring contact CareerOS has researched, with confidence scores and source."
        />
        <EmptyState
          icon={AlertCircle}
          title="Contacts aren't connected"
          description="Set NEXT_PUBLIC_USE_MOCK_DATA=true to preview this page with mock data."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Contacts"
        description="Researched contacts across all applications. Unverified emails are never contacted automatically."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mockContacts.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-foreground">{c.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                <p className="truncate text-xs text-muted-foreground">{c.companyName}</p>
              </div>
              <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                {c.confidence}%
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {c.email ? (
                <Badge variant="secondary" className="gap-1 font-normal">
                  {c.emailVerified ? (
                    <ShieldCheck className="size-3 text-primary" strokeWidth={2} />
                  ) : (
                    <ShieldAlert className="size-3" strokeWidth={2} />
                  )}
                  {c.emailVerified ? "Verified email" : "Unverified email"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-normal">No email</Badge>
              )}
              {c.linkedinUrl && (
                <a
                  href={c.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Link2 className="size-3" strokeWidth={1.75} />
                  LinkedIn
                </a>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              For <span className="text-foreground/80">{c.jobTitle}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
