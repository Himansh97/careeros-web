"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Clock3 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createTechnicalSession, startTechnicalSession } from "@/lib/api/technical-learning";
import { VALID_DURATIONS, type InterviewDuration } from "@/lib/technical-learning/interview-state";
import { cn } from "@/lib/utils";

const ROLES = [
  ["", "Mixed analyst"], ["data-analyst", "Data Analyst"], ["business-analyst", "Business Analyst"],
  ["product-analyst", "Product Analyst"], ["revenue-financial-analyst", "Revenue / Financial Analyst"],
  ["analytics-engineer", "Analytics Engineer"],
] as const;

export function InterviewConfig() {
  const router = useRouter();
  const [duration, setDuration] = React.useState<InterviewDuration>(45);
  const [role, setRole] = React.useState("");
  const create = useMutation({
    mutationFn: async () => {
      const made = await createTechnicalSession(duration, role || null);
      if (!made.ok) throw new Error(made.message ?? "Could not create the round.");
      const started = await startTechnicalSession(made.data.id);
      if (!started.ok) throw new Error(started.message ?? "Could not start the round.");
      return started.data;
    },
    onSuccess: (session) => router.push(`/prep/technical/interview?session=${encodeURIComponent(session.id)}`),
  });

  return (
    <div className="grid gap-6">
      <Link href="/prep/technical" className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Mission map</Link>
      <header className="border-b border-border pb-6"><p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">Boss round</p><h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Configure the interview clock</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">The question set freezes when you start. Hints and correctness stay hidden until the full round is submitted or expires.</p></header>
      <section className="grid gap-px border border-border bg-border md:grid-cols-3" aria-label="Round duration">
        {VALID_DURATIONS.map((minutes) => <button key={minutes} type="button" onClick={() => setDuration(minutes)} aria-pressed={duration === minutes} className={cn("bg-card p-6 text-left focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px]", duration === minutes && "bg-accent/50")}><Clock3 className="size-5 text-primary" /><span className="mt-8 block font-mono text-4xl tabular-nums">{minutes}</span><span className="text-sm text-muted-foreground">minutes</span></button>)}
      </section>
      <label className="grid max-w-md gap-2 text-sm"><span className="font-medium">Question mix</span><select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 border border-input bg-background px-3 focus-visible:outline-2">{ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="text-xs text-muted-foreground">Mixed rounds interleave SQL, Python, and analytical cases.</span></label>
      <div><Button size="lg" onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Freezing question set…" : "Start timed round"}</Button>{create.isError && <p role="alert" className="mt-2 text-sm text-[--color-warning]">{create.error.message}</p>}</div>
    </div>
  );
}
