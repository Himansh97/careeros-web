"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Braces, Clock3, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { MissionMap } from "./mission-map";
import { isLiveApi } from "@/lib/api/client";
import { getTechnicalCurriculum, getTechnicalOverview } from "@/lib/api/technical-learning";

export function TechnicalHome() {
  const overview = useQuery({ queryKey: ["technical", "overview"], queryFn: getTechnicalOverview, enabled: isLiveApi() });
  const curriculum = useQuery({ queryKey: ["technical", "curriculum"], queryFn: getTechnicalCurriculum, enabled: isLiveApi() });
  if (!isLiveApi()) return <><PageHeader title="Technical Interview Lab" description="Learn, practise, transfer, then test under interview conditions." /><EmptyState icon={PlugZap} title="Not connected" description="Start the API to load the real curriculum and your saved mastery." /></>;
  const progress = overview.data?.ok ? overview.data.data : null;
  const content = curriculum.data?.ok ? curriculum.data.data : null;
  const practice = content?.drills.filter((drill) => drill.stage === "practice") ?? [];

  return (
    <>
      <PageHeader
        title="Technical Interview Lab"
        description="Learn the idea, solve it from memory, then prove it transfers to a different shape."
        action={<Button asChild><Link href="/prep/technical/interview"><Clock3 className="size-4" /> Start interview round</Link></Button>}
      />
      <section className="grid gap-px border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-5 sm:col-span-2"><p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">Next retrieval</p><h2 className="mt-3 font-heading text-2xl">{progress?.recommendations[0]?.title ?? "Build your first route"}</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{progress?.recommendations[0]?.reason ?? "Start with a foundation drill. Progress is earned by recall and transfer, not time in the app."}</p>{progress?.recommendations[0] && <Button asChild variant="outline" className="mt-5"><Link href={`/prep/technical/analytics-core/foundation?drill=${encodeURIComponent(progress.recommendations[0].drillId)}`}>Open challenge <ArrowRight className="size-4" /></Link></Button>}</div>
        <div className="bg-card p-5"><Braces className="size-5 text-primary" aria-hidden="true" /><p className="mt-8 font-mono text-3xl tabular-nums">{progress?.skills.filter((skill) => skill.mastered).length ?? 0}<span className="text-base text-muted-foreground">/{progress?.skills.length ?? 8}</span></p><p className="mt-1 text-sm text-muted-foreground">skills transferred</p></div>
      </section>
      <section aria-labelledby="mission-map-heading" className="grid gap-3">
        <div><p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Curriculum routes</p><h2 id="mission-map-heading" className="mt-1 font-heading text-2xl">Choose the next system to bring online</h2></div>
        {overview.isLoading || curriculum.isLoading ? <div className="h-96 animate-pulse border border-border bg-muted" /> : progress && content ? <MissionMap skills={progress.skills} drills={practice} /> : <div role="alert" className="border border-border bg-card p-6 text-sm">The technical curriculum could not be loaded.</div>}
      </section>
      {content && <section aria-labelledby="role-missions-heading"><p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Boss rounds</p><h2 id="role-missions-heading" className="mt-1 font-heading text-2xl">Role missions</h2><div className="mt-3 grid gap-px border border-border bg-border md:grid-cols-5">{content.missions.map((mission) => <div key={mission.id} className="bg-card p-4"><h3 className="font-medium">{mission.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{mission.description}</p></div>)}</div></section>}
    </>
  );
}
