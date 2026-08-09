"use client";

import { AlertCircle, ShieldCheck, ShieldAlert, Ban } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  mockProfileSections,
  mockEvidence,
  type EvidenceStatus,
} from "@/lib/mock/profile";

const isMockMode = () => process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const statusConfig: Record<EvidenceStatus, { icon: typeof ShieldCheck; label: string; className: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", className: "text-primary" },
  needs_review: {
    icon: ShieldAlert,
    label: "Needs review",
    className: "text-[oklch(0.6_0.15_70)] dark:text-[oklch(0.8_0.12_80)]",
  },
  do_not_use: { icon: Ban, label: "Do not use", className: "text-destructive" },
};

function StatusPill({ status }: { status: EvidenceStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.className}`}>
      <cfg.icon className="size-3.5" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

export default function CandidateProfilePage() {
  if (!isMockMode()) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title="Candidate Profile"
          description="Your source of truth — nothing on a resume can claim anything not backed here."
        />
        <EmptyState
          icon={AlertCircle}
          title="Profile isn't connected yet"
          description="This will read from candidate_master_profile.json and career_evidence.json once the profile data layer is wired up — nothing here is fabricated in the meantime."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Candidate Profile"
        description="Your source of truth. Resume tailoring can only draw from verified evidence below."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {mockProfileSections.map((section) => (
          <div key={section.label} className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">{section.label}</h2>
            <dl className="space-y-2.5">
              {section.items.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="flex items-center justify-between gap-2 text-sm text-foreground">
                    <span>{item.value}</span>
                    {item.status && <StatusPill status={item.status} />}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-1 text-sm font-medium text-foreground">Career Evidence Library</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          {mockEvidence.filter((e) => e.status === "verified").length} verified claims ·{" "}
          {mockEvidence.filter((e) => e.status === "needs_review").length} need review. A job
          requirement with no matching claim here is a true gap — it gets disclosed, never invented.
        </p>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {mockEvidence.map((claim) => (
            <div key={claim.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-foreground">{claim.skillLabel}</h3>
                <StatusPill status={claim.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">&ldquo;{claim.statement}&rdquo;</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground/70">{claim.source}</span>
                {claim.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
