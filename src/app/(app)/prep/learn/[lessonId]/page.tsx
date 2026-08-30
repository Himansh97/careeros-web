"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Loader2,
  MessageCircleQuestion,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMotionSafe } from "@/components/motion/primitives";
import { Diagram } from "@/components/diagram/diagram";
import {
  getLesson,
  markExplained,
  teachLesson,
  type TeachMode,
} from "@/lib/api/learn";

/**
 * One lesson, taught, and interruptible at any point.
 *
 * The buttons are the whole feature. Being able to say "again, simpler" without
 * losing your place is the difference between reading a page and being taught by
 * someone — and "simpler" here means the same content at a lower rung, not a
 * shorter version with the hard parts removed, which is the thing that was
 * actually asked for.
 *
 * The tutor is bounded server-side by the lesson's key points, which never reach
 * this page. Asked something the lesson does not cover it says so and names
 * where the question belongs, rather than obliging — a tutor that invents is
 * worse than no tutor, because the person being taught cannot tell.
 *
 * The worked example arrives already executed. A lesson claiming a join turns 24
 * rows into 72, on a page not showing it turn 24 rows into 72, is asking to be
 * believed about the one thing it could simply demonstrate.
 */

const INTERRUPTIONS: { mode: TeachMode; label: string; hint: string }[] = [
  { mode: "simpler", label: "Again, simpler", hint: "same ideas, plainer words" },
  { mode: "deeper", label: "Go deeper", hint: "the mechanism underneath" },
  { mode: "example", label: "Another example", hint: "a different concrete case" },
];

interface Turn {
  role: "tutor" | "learner";
  mode?: TeachMode;
  content: string;
}

function Prose({ text }: { text: string }) {
  // Plain paragraphs. The tutor is told not to use markdown headings at this
  // length, and pulling in a renderer for text we control would be a dependency
  // bought to solve a problem we chose not to have.
  return (
    <div className="space-y-3">
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i} className="max-w-prose text-sm leading-relaxed text-foreground">
          {para}
        </p>
      ))}
    </div>
  );
}

/**
 * `useSearchParams` forces this subtree to be client-rendered, and Next refuses
 * to build a page that reads it without a boundary — `next dev`, `tsc` and
 * `eslint` all pass while `next build` fails, which has already cost a broken
 * production build in this repo once.
 */
export default function LessonPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Lesson />
    </React.Suspense>
  );
}

function Lesson() {
  const params = useParams<{ lessonId: string }>();
  // Arriving from a failed explain-back: one idea was missed or stated
  // backwards, and re-teaching the whole lesson would bury the answer to the
  // question that actually brought them here.
  const stuckOn = useSearchParams().get("stuck") ?? "";
  const queryClient = useQueryClient();
  const motionSafe = useMotionSafe();

  const [thread, setThread] = React.useState<Turn[]>(() =>
    stuckOn ? [{ role: "learner", content: stuckOn }] : [],
  );
  const [question, setQuestion] = React.useState("");
  const [busy, setBusy] = React.useState<TeachMode | null>(null);
  const started = React.useRef(false);

  const lesson = useQuery({
    queryKey: ["lesson", params.lessonId],
    queryFn: () => getLesson(params.lessonId),
    retry: false,
  });

  const explained = useMutation({
    mutationFn: () => markExplained(params.lessonId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lessons"] });
      void queryClient.invalidateQueries({ queryKey: ["lesson", params.lessonId] });
      toast.success("Marked as explained back", {
        description: "It counts as mastered once the linked drill is cleared too.",
      });
    },
  });

  async function ask(mode: TeachMode, message = "", push = true) {
    setBusy(mode);
    if (message && push) setThread((t) => [...t, { role: "learner", content: message }]);
    const history = thread.map((t) => ({
      role: t.role === "tutor" ? "assistant" : "user",
      content: t.content,
    }));
    const res = await teachLesson(params.lessonId, mode, message, history);
    setBusy(null);

    if (!res.ok) {
      toast.error("Couldn't reach the tutor");
      return;
    }
    if (!res.data.ok) {
      // Said plainly. No key, spent budget, no response — the honest failure,
      // never a filler paragraph that looks like teaching.
      setThread((t) => [
        ...t,
        { role: "tutor", mode, content: `I couldn't answer — ${res.data.reason}.` },
      ]);
      return;
    }
    setThread((t) => [...t, { role: "tutor", mode, content: res.data.body }]);
  }

  // The opening pass is fetched once on arrival. It is served from storage after
  // the first time, so this is free on every later visit.
  React.useEffect(() => {
    if (started.current || !lesson.data?.ok) return;
    started.current = true;
    // Already in the thread as the opening turn, so it must not be pushed again.
    void ask(stuckOn ? "stuck" : "teach", stuckOn, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.data?.ok]);

  if (lesson.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lesson.data?.ok) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Lesson not found"
        description="It may have been renamed. Open the track to pick another."
      />
    );
  }

  const l = lesson.data.data;
  const done = l.status === "explained" || l.status === "mastered";

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/prep/learn">
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Back to the tracks
        </Link>
      </Button>

      <header>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
          {l.track} · {l.level}
        </span>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {l.title}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {l.hook}
        </p>
      </header>

      {l.objectives.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            By the end you should be able to
          </h2>
          <ul className="mt-2 space-y-1">
            {l.objectives.map((o) => (
              <li key={o} className="flex gap-2 text-sm text-foreground">
                <span className="text-muted-foreground">—</span>
                {o}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- the teaching ---- */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {thread.map((turn, i) => (
            <motion.div
              key={i}
              initial={motionSafe ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {turn.role === "learner" ? (
                <p className="ml-auto max-w-[80%] rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                  {turn.content}
                </p>
              ) : (
                <div>
                  {turn.mode && turn.mode !== "teach" && (
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {turn.mode}
                    </span>
                  )}
                  <Prose text={turn.content} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
            {busy === "teach" ? "Reading the lesson…" : "Thinking…"}
          </p>
        )}
      </div>

      {/* The picture the explanation was building toward. It sits between the
          teaching and the example on purpose — after the words that earn it,
          before the query that tests it. */}
      {l.visual && (
        <section>
          <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Picture it
          </h2>
          <Diagram spec={l.visual} />
        </section>
      )}

      {/* ---- the worked example, already run ---- */}
      {l.example && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Worked example
          </h2>
          <p className="mt-2 max-w-prose text-sm text-foreground">{l.example.caption}</p>

          {l.example.sql && (
            <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground">
              {l.example.sql}
            </pre>
          )}

          {l.example.result?.ok && (
            <div className="mt-2 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {l.example.result.columns.map((c) => (
                      <th key={c} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {l.example.result.rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 tabular-nums text-foreground">
                          {String(cell ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {l.example.body && (
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {l.example.body}
            </p>
          )}
        </section>
      )}

      {/* ---- interruptions ---- */}
      <div className="sticky bottom-4 space-y-2 rounded-lg border border-border bg-card/95 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {INTERRUPTIONS.map((option) => (
            <Button
              key={option.mode}
              variant="outline"
              size="sm"
              disabled={busy !== null}
              title={option.hint}
              onClick={() => void ask(option.mode)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!question.trim() || busy) return;
                const text = question.trim();
                setQuestion("");
                void ask("stuck", text);
              }
            }}
            rows={2}
            placeholder="Where did you lose it? — 'I don't follow the bit about the frame'"
            className="resize-none"
          />
          <Button
            size="sm"
            disabled={busy !== null || !question.trim()}
            onClick={() => {
              const text = question.trim();
              setQuestion("");
              void ask("stuck", text);
            }}
          >
            <Send className="size-3.5" strokeWidth={1.75} />
            <span className="sr-only">Ask</span>
          </Button>
        </div>
      </div>

      {/* ---- misconceptions, interview angle, hand-off ---- */}
      {l.misconceptions.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            What people get wrong
          </h2>
          {l.misconceptions.map((m) => (
            <div key={m.claim} className="rounded-lg border border-border bg-card p-3">
              <p className="flex gap-2 text-sm text-muted-foreground line-through decoration-destructive/50">
                <MessageCircleQuestion className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                {m.claim}
              </p>
              <p className="mt-1 pl-5 text-sm leading-relaxed text-foreground">
                {m.correction}
              </p>
            </div>
          ))}
        </section>
      )}

      {l.interviewAngle && (
        <section className="rounded-lg border border-primary/25 bg-primary/[0.04] p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
            How it gets asked
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground">
            {l.interviewAngle}
          </p>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button
          variant={done ? "outline" : "default"}
          disabled={explained.isPending || done}
          onClick={() => explained.mutate()}
        >
          {done ? (
            <>
              <Check className="size-3.5" strokeWidth={1.75} />
              Explained back
            </>
          ) : (
            "I can explain this now"
          )}
        </Button>
        {l.practiceDrillId && (
          <Button asChild variant="outline">
            <Link href={`/prep/technical/analytics-core/x?drill=${l.practiceDrillId}`}>
              Try the drill
            </Link>
          </Button>
        )}
        {l.sources.length > 0 && (
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">
            {l.sources.length} source{l.sources.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
