"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { isLiveApi } from "@/lib/api/client";
import { getProfile } from "@/lib/api/profile";

/** Renders whatever the YAML actually contains, without assuming a shape. */
function valueToText(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export default function PreferencesPage() {
  const live = isLiveApi();
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled: live,
  });

  if (!live) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Preferences" description="Target roles and application answers." />
        <EmptyState
          icon={AlertCircle}
          title="Preferences aren't connected"
          description="Start the CareerOS API and set NEXT_PUBLIC_API_URL. These read from job_preferences.yaml and application_answers.yaml."
          className="flex-1"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader title="Preferences" description="Target roles and application answers." />
        <EmptyState
          icon={AlertCircle}
          title="Couldn't read preferences"
          description="The API couldn't load job_preferences.yaml or application_answers.yaml."
          className="flex-1"
        />
      </div>
    );
  }

  const prefs = data.data.preferences ?? {};
  const answers = data.data.applicationAnswers ?? {};

  const targetRoles = (prefs.target_roles as string[] | undefined) ?? [];
  const locations = (prefs.preferred_locations as string[] | undefined) ?? [];
  const employment = (prefs.employment_types as string[] | undefined) ?? [];

  // Self-identification is shown separately and never edited automatically.
  const demographics = (answers.demographic_preferences as Record<string, unknown>) ?? {};
  const answerEntries = Object.entries(answers).filter(
    ([k, v]) =>
      k !== "demographic_preferences" &&
      k !== "education" &&
      k !== "employment_history" &&
      typeof v !== "object"
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Preferences"
        description="Read live from job_preferences.yaml and application_answers.yaml in your careeros directory."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Target roles</h2>
          <div className="flex flex-wrap gap-1.5">
            {targetRoles.length ? (
              targetRoles.map((r) => (
                <Badge key={r} variant="secondary" className="font-normal">{r}</Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">None configured</span>
            )}
          </div>

          <h2 className="mb-2 mt-4 text-sm font-medium text-foreground">Locations</h2>
          <div className="flex flex-wrap gap-1.5">
            {locations.map((l) => (
              <Badge key={l} variant="secondary" className="font-normal">{l}</Badge>
            ))}
          </div>

          {employment.length > 0 && (
            <>
              <h2 className="mb-1 mt-4 text-sm font-medium text-foreground">Employment type</h2>
              <p className="text-sm text-muted-foreground">{employment.join(", ")}</p>
            </>
          )}

          {prefs.minimum_salary !== undefined && (
            <>
              <h2 className="mb-1 mt-4 text-sm font-medium text-foreground">Minimum salary</h2>
              <p className="text-sm text-muted-foreground">
                ${Number(prefs.minimum_salary).toLocaleString()}
              </p>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Application answers</h2>
          <dl className="space-y-2.5">
            {answerEntries.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{humanize(k)}</dt>
                <dd className="max-w-[60%] text-right text-sm text-foreground">
                  {valueToText(v)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {Object.keys(demographics).length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Self-identification</h2>
          <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
            Never inferred and never changed automatically — edit
            application_answers.yaml directly to change these.
          </p>
          <dl className="grid gap-2.5 sm:grid-cols-2">
            {Object.entries(demographics).map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3">
                <dt className="text-xs text-muted-foreground">{humanize(k)}</dt>
                <dd className="text-right text-sm text-foreground">{valueToText(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
