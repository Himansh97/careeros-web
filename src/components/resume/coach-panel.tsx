"use client";

import * as React from "react";
import { Loader2, Sparkles, ShieldAlert, ShieldCheck, ShieldQuestion, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  applyCoachProposal,
  coachResume,
  type CoachMessage,
  type CoachProposal,
} from "@/lib/api/resume-coach";
import { cn } from "@/lib/utils";

/**
 * Chat-driven resume editing, with the containment gate visible in the UI.
 *
 * The design point that matters: **a rejected proposal is shown, not hidden.**
 * When the model reaches for something the evidence does not support, that is
 * the most useful thing on the screen — it tells the candidate what the model
 * tried to inflate, which is the entire argument for running a resume through
 * a gate. A panel that silently dropped those would leave them thinking the
 * model simply had no ideas.
 *
 * So Apply is disabled on a rejection and the finding is printed in full. If
 * the candidate genuinely wants that wording, the route is the manual bullet
 * editor on the resume itself — typed by them, saved under their own name, and
 * marked unverified. That is a deliberate speed bump, not an oversight: the
 * author field records who vouches for the claim.
 */

const VERDICT = {
  pass: {
    icon: ShieldCheck,
    label: "Contained",
    chip: "border-success/40 bg-success/10 text-success",
    note: "Every figure and name in this traces to the claim.",
  },
  review: {
    icon: ShieldQuestion,
    label: "Needs your eye",
    chip: "border-warning/40 bg-warning/10 text-warning",
    note: "Applying queues this for review — it will not go on the resume yet.",
  },
  reject: {
    icon: ShieldAlert,
    label: "Refused",
    chip: "border-destructive/40 bg-destructive/10 text-destructive",
    note: "This claims something the evidence does not support, so it cannot be applied.",
  },
} as const;

function verdictOf(v: string) {
  return VERDICT[v as keyof typeof VERDICT] ?? VERDICT.reject;
}

function ProposalCard({
  proposal,
  onApply,
  applying,
}: {
  proposal: CoachProposal;
  onApply: () => void;
  applying: boolean;
}) {
  const tone = verdictOf(proposal.verdict);
  const Icon = tone.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
            tone.chip,
          )}
        >
          <Icon className="size-3" strokeWidth={2} aria-hidden="true" />
          {tone.label}
        </span>
        {proposal.employer && (
          <span className="truncate text-xs text-muted-foreground">{proposal.employer}</span>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-foreground">{proposal.proposed}</p>

      {proposal.why && (
        <p className="mt-1.5 text-xs text-muted-foreground">{proposal.why}</p>
      )}

      {proposal.findings.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {proposal.findings.map((finding, i) => (
            <li key={`${finding.code}-${i}`} className="text-xs text-muted-foreground">
              <span
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.1em]",
                  finding.tier === "reject" ? "text-destructive" : "text-warning",
                )}
              >
                {finding.code}
              </span>{" "}
              {finding.detail}
            </li>
          ))}
        </ul>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          Compare with the claim it came from
        </summary>
        <div className="mt-2 space-y-2 text-xs">
          <p>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              now
            </span>
            <br />
            <span className="text-muted-foreground">{proposal.current}</span>
          </p>
          <p>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              recorded claim
            </span>
            <br />
            <span className="text-muted-foreground">{proposal.sourceClaim}</span>
          </p>
        </div>
      </details>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant={proposal.verdict === "pass" ? "default" : "outline"}
          disabled={!proposal.applicable || applying}
          onClick={onApply}
        >
          {applying && <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />}
          {proposal.queued ? "Queue for review" : "Apply"}
        </Button>
        <span className="text-xs text-muted-foreground">{tone.note}</span>
      </div>
    </div>
  );
}

interface CoachPanelProps {
  jobId: string;
  /** Refetches the resume after a proposal lands. */
  onApplied: () => Promise<unknown> | void;
}

export function ResumeCoachPanel({ jobId, onApplied }: CoachPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [instruction, setInstruction] = React.useState("");
  const [thread, setThread] = React.useState<CoachMessage[]>([]);
  const [proposals, setProposals] = React.useState<CoachProposal[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [applyingId, setApplyingId] = React.useState<string | null>(null);

  async function send() {
    const text = instruction.trim();
    if (!text || busy) return;

    setBusy(true);
    // The turn is appended before the request so the panel reads like a
    // conversation rather than going blank while it waits.
    const sent: CoachMessage[] = [...thread, { role: "user", content: text }];
    setThread(sent);
    setInstruction("");
    setProposals([]);

    const res = await coachResume(jobId, text, thread);
    setBusy(false);

    if (!res.ok) {
      setThread([
        ...sent,
        {
          role: "assistant",
          content:
            res.reason === "not_connected"
              ? "The CareerOS API isn't reachable — start it on port 8000."
              : "That request didn't get through.",
        },
      ]);
      return;
    }

    if (!res.data.ok) {
      // No key, spent budget, unreadable response. Said plainly — a made-up
      // reply here would be the one thing this feature must never do.
      setThread([
        ...sent,
        { role: "assistant", content: `No rewrite this time — ${res.data.reason}.` },
      ]);
      return;
    }

    setThread([...sent, { role: "assistant", content: res.data.reply }]);
    setProposals(res.data.proposals);
  }

  async function apply(proposal: CoachProposal) {
    setApplyingId(proposal.claimId);
    const res = await applyCoachProposal(jobId, proposal);
    setApplyingId(null);

    if (!res.ok || !res.data.ok) {
      toast.error("The gate refused that rewrite", {
        description:
          (res.ok ? res.data.problems?.[0] : undefined) ??
          "It claims something the evidence doesn't support.",
      });
      return;
    }

    setProposals((current) => current.filter((p) => p.claimId !== proposal.claimId));
    await onApplied();
    toast.success(res.data.queued ? "Queued for review" : "Applied to the resume", {
      description: res.data.queued
        ? "It is not on the resume yet — approve it in the review queue."
        : "Every figure in it traces to your recorded claim.",
    });
  }

  const blocked = proposals.filter((p) => !p.applicable).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          Fix with AI
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Fix this resume</SheetTitle>
          <SheetDescription>
            Say what you want changed. Every rewrite is checked against the claim it
            came from before you see it — anything that reaches beyond your evidence
            is shown, and refused.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {thread.length === 0 && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Things that work well here:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>&ldquo;Lead with the governance work, it&rsquo;s buried&rdquo;</li>
                <li>&ldquo;This reads junior — tighten it without overclaiming&rdquo;</li>
                <li>&ldquo;Align the top two bullets to the stakeholder requirement&rdquo;</li>
                <li>&ldquo;Cut the filler, these are too long&rdquo;</li>
              </ul>
            </div>
          )}

          {thread.map((message, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "ml-auto bg-primary/10 text-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {message.content}
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
              Reading your evidence…
            </div>
          )}

          {proposals.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {proposals.length} rewrite{proposals.length === 1 ? "" : "s"}
                {blocked > 0 && ` · ${blocked} refused`}
              </p>
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.claimId}
                  proposal={proposal}
                  applying={applyingId === proposal.claimId}
                  onApply={() => void apply(proposal)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="What should change?"
              rows={2}
              className="resize-none"
            />
            <Button size="sm" disabled={busy || !instruction.trim()} onClick={() => void send()}>
              <Send className="size-3.5" strokeWidth={1.75} />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Nothing here can add a figure, tool or employer your evidence doesn&rsquo;t
            already record. To write something it refuses, edit the bullet directly —
            it saves under your name and shows as unverified.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
