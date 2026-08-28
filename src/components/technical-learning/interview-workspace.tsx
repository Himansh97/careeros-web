"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock3, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CaseResponse } from "./case-response";
import { PythonEditor } from "./python-editor";
import { ResultGrid } from "./result-grid";
import { SqlEditor } from "./sql-editor";
import {
  getTechnicalSession,
  runTechnicalSql,
  saveTechnicalAnswer,
  submitTechnicalSession,
  type QueryResult,
  type TechnicalQuestion,
  type TechnicalSession,
} from "@/lib/api/technical-learning";
import { initialInterviewState, interviewReducer, remainingSeconds } from "@/lib/technical-learning/interview-state";
import { cn } from "@/lib/utils";

function Workspace({ session }: { session: TechnicalSession }) {
  const router = useRouter();
  const [state, dispatch] = React.useReducer(interviewReducer, session.answers, initialInterviewState);
  const [activeId, setActiveId] = React.useState(session.questions[0]?.id ?? "");
  const [drafts, setDrafts] = React.useState<Record<string, string>>(() => Object.fromEntries(session.questions.map((question) => [question.id, typeof session.answers[question.id] === "string" ? String(session.answers[question.id]) : question.starter_answer])));
  const [preview, setPreview] = React.useState<QueryResult | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const timers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const active = session.questions.find((question) => question.id === activeId) ?? session.questions[0];
  const activeIndex = session.questions.findIndex((question) => question.id === active?.id);
  const seconds = session.expiresAt ? remainingSeconds(session.serverNow, session.expiresAt, elapsed) : session.durationMinutes * 60;

  React.useEffect(() => {
    const timer = setInterval(() => setElapsed((current) => current + 1000), 1000);
    return () => clearInterval(timer);
  }, []);

  const persist = async (questionId: string, answer: unknown) => {
    dispatch({ type: "saving", questionId });
    const response = await saveTechnicalAnswer(session.id, questionId, answer);
    dispatch({ type: response.ok ? "saved" : "save-failed", questionId });
  };
  const edit = (questionId: string, answer: unknown, draft?: string) => {
    dispatch({ type: "edit", questionId, answer });
    if (draft !== undefined) setDrafts((current) => ({ ...current, [questionId]: draft }));
    clearTimeout(timers.current[questionId]);
    timers.current[questionId] = setTimeout(() => void persist(questionId, answer), 700);
  };

  const run = useMutation({
    mutationFn: ({ question, sql }: { question: TechnicalQuestion; sql: string }) => runTechnicalSql(question.id, sql),
    onSuccess: (response) => { if (response.ok) setPreview(response.data); },
  });
  const submit = useMutation({
    mutationFn: () => submitTechnicalSession(session.id),
    onSuccess: (response) => { if (response.ok) router.replace(`/prep/technical/results/${encodeURIComponent(session.id)}`); },
  });

  React.useEffect(() => {
    if (seconds === 0 && !submit.isPending) submit.mutate();
  }, [seconds, submit]);

  if (!active) return null;
  const answer = drafts[active.id] ?? "";
  const saveState = state.saveState[active.id] ?? "clean";
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="grid min-h-[calc(100svh-12rem)] grid-rows-[auto_1fr_auto] gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3"><div><p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">Timed round · feedback locked</p><h1 className="font-heading text-xl">{session.role?.replaceAll("-", " ") ?? "Mixed analyst"}</h1></div><div className="flex items-center gap-4"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Save className="size-3" /> {saveState === "failed" ? "Save failed — edit to retry" : saveState}</span><span className={cn("flex items-center gap-2 font-mono text-xl tabular-nums", seconds < 300 && "text-warning")}><Clock3 className="size-4" /> {clock}</span></div></header>
      <div className="grid min-h-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Interview questions" className="border border-border bg-card p-2">{session.questions.map((question, index) => <button key={question.id} type="button" onClick={() => { setActiveId(question.id); setPreview(null); }} aria-current={question.id === active.id ? "step" : undefined} className={cn("flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left text-sm last:border-0 focus-visible:outline-2", question.id === active.id && "bg-accent/50")}><span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span className="truncate">{question.title}</span></button>)}</nav>
        <main className="grid min-w-0 content-start gap-4"><div className="border border-border bg-card p-5"><p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Question {activeIndex + 1} · {active.kind}</p><p className="mt-3 text-base leading-7">{active.prompt}</p></div>{active.kind === "sql" ? <><SqlEditor key={active.id} value={answer} onChange={(value) => edit(active.id, value, value)} onRun={() => run.mutate({ question: active, sql: answer })} /><div className="border border-border bg-card"><ResultGrid result={preview} /></div><Button className="w-fit" variant="outline" onClick={() => run.mutate({ question: active, sql: answer })}>Run query</Button></> : active.kind === "python" ? <><PythonEditor key={active.id} value={answer} fixture={active.fixture} onChange={(value) => setDrafts((current) => ({ ...current, [active.id]: value }))} onOutput={(output) => edit(active.id, output)} />{state.answers[active.id] !== undefined && <pre className="border border-border bg-card p-4 font-mono text-xs">{JSON.stringify(state.answers[active.id], null, 2)}</pre>}</> : <CaseResponse value={answer} onChange={(value) => edit(active.id, value, value)} />}</main>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><Button variant="outline" disabled={activeIndex <= 0} onClick={() => setActiveId(session.questions[activeIndex - 1].id)}><ChevronLeft className="size-4" /> Previous</Button><div className="flex gap-2">{activeIndex < session.questions.length - 1 ? <Button onClick={() => setActiveId(session.questions[activeIndex + 1].id)}>Next <ChevronRight className="size-4" /></Button> : <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Submit complete round</Button>}</div></footer>
    </div>
  );
}

export function InterviewWorkspace({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const session = useQuery({ queryKey: ["technical", "session", sessionId], queryFn: () => getTechnicalSession(sessionId), refetchInterval: 5000 });
  React.useEffect(() => { if (session.data?.ok && session.data.data.state === "graded") router.replace(`/prep/technical/results/${encodeURIComponent(sessionId)}`); }, [router, session.data, sessionId]);
  if (session.isLoading) return <div className="h-96 animate-pulse border border-border bg-muted" />;
  if (!session.data?.ok) return <div role="alert" className="border border-border bg-card p-6">The interview session could not be loaded.</div>;
  return <Workspace key={session.data.data.id} session={session.data.data} />;
}
