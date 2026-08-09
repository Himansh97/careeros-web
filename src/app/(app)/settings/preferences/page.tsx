"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

const targetRoles = [
  "Project Manager (Data/Analytics)",
  "Business Analytics Consultant",
  "Data Analyst",
  "Business Analyst",
  "AI Engineer",
];

const locations = ["New York", "Dallas, TX", "Remote"];

const applicationAnswers = [
  { label: "Work authorization", value: "OPT (F-1 Optional Practical Training)" },
  { label: "Sponsorship required", value: "No (per candidate)" },
  { label: "Relocation", value: "Willing to relocate" },
  { label: "Work mode", value: "Open to remote or onsite" },
  { label: "Start date", value: "One week from each application's date" },
  { label: "Salary expectation", value: "Follows each posting's stated range" },
];

const disclosures = [
  { label: "Gender", value: "Prefer not to answer" },
  { label: "Race / ethnicity", value: "Asian, not Hispanic or Latino" },
  { label: "Veteran status", value: "Not a veteran" },
  { label: "Disability", value: "No disability" },
];

export default function PreferencesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Preferences"
        description="Target roles, locations, and the standard answers used on application forms."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Target roles</h2>
          <div className="flex flex-wrap gap-1.5">
            {targetRoles.map((r) => (
              <Badge key={r} variant="secondary" className="font-normal">{r}</Badge>
            ))}
          </div>
          <h2 className="mb-2 mt-4 text-sm font-medium text-foreground">Locations</h2>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((l) => (
              <Badge key={l} variant="secondary" className="font-normal">{l}</Badge>
            ))}
          </div>
          <h2 className="mb-1 mt-4 text-sm font-medium text-foreground">Employment type</h2>
          <p className="text-sm text-muted-foreground">Full-time</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Application answers</h2>
          <dl className="space-y-2.5">
            {applicationAnswers.map((a) => (
              <div key={a.label} className="flex items-start justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{a.label}</dt>
                <dd className="text-right text-sm text-foreground">{a.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-foreground">Self-identification</h2>
        <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
          Never inferred, never changed automatically — only ever set by you.
        </p>
        <dl className="grid gap-2.5 sm:grid-cols-2">
          {disclosures.map((d) => (
            <div key={d.label} className="flex items-start justify-between gap-3">
              <dt className="text-xs text-muted-foreground">{d.label}</dt>
              <dd className="text-right text-sm text-foreground">{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
