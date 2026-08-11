"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { importJobFromText, importJobFromUrl } from "@/lib/api/jobs";
import type { ImportedJobResult } from "@/lib/api/jobs";

/**
 * Paste a posting link, land on its tailored resume.
 *
 * Some hosts are refused rather than fetched — LinkedIn and Indeed prohibit
 * automated access in their terms — so this falls through to a paste-the-text
 * form. That path reaches the same scoring and tailoring code, so nothing is
 * lost by using it; the only cost is typing a title and company.
 */
export function ImportByUrl() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<ImportedJobResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Manual-paste fallback fields.
  const [title, setTitle] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [description, setDescription] = React.useState("");

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || busy) return;
    setBusy(true);
    setProblem(null);
    setError(null);

    const res = await importJobFromUrl(url.trim());
    setBusy(false);

    if (!res.ok) {
      setError(
        res.reason === "not_connected"
          ? "The API isn't reachable. Start it on port 8000 and try again."
          : (res.message ?? "Something went wrong reading that link.")
      );
      return;
    }

    if (res.data.kind === "job") {
      // Stop before tailoring anything for a role that can't be accepted. The
      // gate covers citizenship, clearance, ITAR and work location — a Dublin
      // posting on F-1 OPT is as much a dead end as a cleared defence role,
      // and silently showing a resume scored 0 explains neither.
      if (res.data.eligibility?.verdict === "INELIGIBLE") {
        setProblem(res.data);
        return;
      }
      router.push(`/resume/${encodeURIComponent(res.data.jobId)}`);
      return;
    }
    setProblem(res.data);
  }

  async function submitText(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim() || busy) return;
    setBusy(true);
    setError(null);

    const res = await importJobFromText({
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      applyUrl: url.trim(),
    });
    setBusy(false);

    if (!res.ok) {
      setError(res.message ?? "Could not save that posting.");
      return;
    }
    router.push(`/resume/${encodeURIComponent(res.data.jobId)}`);
  }

  const ineligible =
    problem?.kind === "job" && problem.eligibility?.verdict === "INELIGIBLE";

  return (
    <div className="rounded-lg border bg-card p-4">
      <form onSubmit={submitUrl} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a job posting link…"
            className="pl-9"
            aria-label="Job posting URL"
          />
        </div>
        <Button type="submit" disabled={busy || !url.trim()}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Reading…
            </>
          ) : (
            "Tailor my resume"
          )}
        </Button>
      </form>

      <p className="mt-2 text-xs text-muted-foreground">
        Greenhouse, Lever and Ashby links are read directly from their public
        APIs. Other links fall back to pasting the description.
      </p>

      {error ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {ineligible && problem?.kind === "job" ? (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="flex items-start gap-2 text-sm font-medium text-destructive">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              {problem.company} — {problem.title}: you aren&apos;t eligible for
              this role, so no resume was tailored.
            </span>
          </p>
          <ul className="mt-2 ml-6 list-disc space-y-1 text-sm text-muted-foreground">
            {(problem.eligibility?.blockers ?? []).map((b, i) => (
              <li key={i}>{b.detail}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {problem && problem.kind !== "job" ? (
        <div className="mt-4 border-t pt-4">
          <p className="flex items-start gap-2 text-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              {problem.kind === "blocked" ? (
                <>
                  <strong>{problem.host}</strong> — {problem.reason}
                </>
              ) : (
                problem.reason
              )}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste the job description below instead. It gets scored and tailored
            exactly the same way.
          </p>

          <form onSubmit={submitText} className="mt-3 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job title"
                aria-label="Job title"
              />
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company"
                aria-label="Company"
              />
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={8}
            />
            <Button
              type="submit"
              disabled={
                busy || !title.trim() || !company.trim() || !description.trim()
              }
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Tailor from this description"
              )}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
