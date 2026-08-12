"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, AlertTriangle, MessageCircleQuestion, Quote, HelpCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInterviewPack } from "@/lib/api/ops";
import { InterviewIntel } from "@/components/applications/interview-intel";
import { isLiveApi } from "@/lib/api/client";

/**
 * The brief for an interview, assembled from what the system already knows.
 *
 * By the time a recruiter replies, CareerOS holds more about the application
 * than the candidate can keep in their head: which requirements the posting
 * screens on, which bullets actually went out, which requirements were thin,
 * and what was said in the thread. It was spread across four screens, so the
 * candidate re-read the job description and hoped.
 *
 * The section that earns this feature is "expect to be probed". An interviewer
 * testing the role's real requirements lands on exactly the weak ones, and
 * knowing which beforehand is the difference between being caught out and
 * having an honest answer ready.
 */
export function InterviewPack({ jobId }: { jobId: string }) {
  const [open, setOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["interview-pack", jobId],
    queryFn: () => getInterviewPack(jobId),
    enabled: open && isLiveApi(),
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <BookOpen className="size-3.5" strokeWidth={1.75} />
        Interview prep
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border p-5 pb-4">
            <DialogTitle>
              {data?.ok ? `${data.data.role.title} — ${data.data.role.company}` : "Interview prep"}
            </DialogTitle>
            <DialogDescription>
              Built from the posting, your evidence file, and what you actually sent.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {data && !data.ok && (
              <p className="text-sm text-muted-foreground">
                Couldn&apos;t build the pack — the CareerOS API isn&apos;t reachable.
              </p>
            )}

            {data?.ok && (
              <>
                {/* Their process first. Knowing there is a live SQL round and a
                    written project review changes what you prepare far more
                    than any of the sections below. */}
                <Section
                  icon={Building2}
                  title="Their process"
                  hint="Researched from public reports, with the sources named."
                >
                  <InterviewIntel intel={data.data.intel} />
                </Section>

                {data.data.expectToBeProbed.length > 0 && (
                  <Section
                    icon={AlertTriangle}
                    title="Expect to be probed here"
                    hint="An interviewer testing the real requirements will land on these."
                  >
                    <ul className="space-y-2">
                      {data.data.expectToBeProbed.map((w) => (
                        <li
                          key={w.requirement}
                          className={`rounded-md border p-2.5 ${
                            w.severity === "high"
                              ? "border-warning/30 bg-warning/10"
                              : "border-border bg-muted/40"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {w.requirement}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {w.importance} · {w.match}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{w.guidance}</p>
                          {w.closest && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Closest you have: &ldquo;{w.closest}&rdquo;
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                <Section
                  icon={MessageCircleQuestion}
                  title="Questions this posting implies"
                  hint="Derived from what it actually asks for — not a generic bank."
                >
                  <ul className="space-y-1.5">
                    {data.data.likelyQuestions.map((q) => (
                      <li key={q.question} className="flex items-start gap-2 text-sm">
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                            q.difficulty === "high"
                              ? "bg-warning"
                              : q.difficulty === "medium"
                                ? "bg-info"
                                : "bg-muted-foreground/40"
                          }`}
                        />
                        <span className="text-foreground">{q.question}</span>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section
                  icon={Quote}
                  title="Your stories"
                  hint="From your evidence file. Ordered by how much ground each covers."
                >
                  <ul className="space-y-2">
                    {data.data.stories.map((s) => (
                      <li key={s.claimId} className="rounded-md border border-border p-2.5">
                        <p className="text-sm text-foreground">{s.situation}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.employer} · {s.useWhen}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section
                  icon={HelpCircle}
                  title="Ask them"
                  hint="Grounded in this posting rather than a list anyone could read out."
                >
                  <ul className="space-y-1.5">
                    {data.data.questionsToAsk.map((q) => (
                      <li key={q} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section
                  icon={BookOpen}
                  title="What they actually received"
                  hint="Reconstructing this from memory is how candidates contradict their own application."
                >
                  <ul className="space-y-1">
                    {data.data.whatTheySaw.bullets.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        · {b}
                      </li>
                    ))}
                  </ul>
                </Section>

                <p className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
                  {data.data.notIncluded}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <p className="mb-2 mt-0.5 text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}
