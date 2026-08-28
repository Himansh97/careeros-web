import Link from "next/link";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TechnicalSession } from "@/lib/api/technical-learning";

export function Scorecard({ session }: { session: TechnicalSession }) {
  if (!session.scorecard) return null;
  const percent = Math.round(session.scorecard.score * 100);
  return (
    <div className="grid gap-6">
      <header className="grid gap-px border border-border bg-border md:grid-cols-[1fr_260px]">
        <div className="bg-card p-6 md:p-8"><p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">Round debrief · {session.completionReason}</p><h1 className="mt-3 font-display text-4xl font-semibold">{session.scorecard.passed ? "Interview systems nominal" : "Review queue ready"}</h1><p className="mt-3 text-sm text-muted-foreground">Feedback appeared only after the complete frozen round was graded.</p></div>
        <div className="flex flex-col justify-end bg-card p-6"><span className="font-mono text-6xl tabular-nums">{percent}</span><span className="text-sm text-muted-foreground">deterministic score / 100</span></div>
      </header>
      <section className="grid gap-px border border-border bg-border">
        {session.scorecard.questions.map((question, index) => <article key={question.questionId} className="grid gap-4 bg-card p-5 md:grid-cols-[42px_1fr_auto]"><div className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</div><div><div className="flex items-center gap-2">{question.passed ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-warning" />}<h2 className="font-medium">{question.title}</h2></div><p className="mt-2 text-sm text-muted-foreground">{question.summary}</p>{question.differences.map((item) => <p key={item} className="mt-1 text-xs text-warning">{item}</p>)}<details className="mt-3"><summary className="cursor-pointer text-xs font-medium">Review solution and debrief</summary><pre className="mt-2 overflow-x-auto border border-border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">{question.solution}</pre><p className="mt-2 text-sm text-muted-foreground">{question.debrief}</p></details></div><span className="font-mono text-sm tabular-nums">{Math.round(question.score * 100)}</span></article>)}
      </section>
      <div className="flex flex-wrap gap-2"><Button asChild><Link href="/prep/technical"><RotateCcw className="size-4" /> Review weak routes</Link></Button><Button asChild variant="outline"><Link href="/prep/technical/interview">Start another round</Link></Button></div>
    </div>
  );
}
