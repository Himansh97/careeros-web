"use client";

import { AlertCircle, ShieldCheck, ShieldAlert, Link2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { mockContacts } from "@/lib/mock/outreach";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export default function ContactsPage() {
  if (!isMockMode()) {
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
