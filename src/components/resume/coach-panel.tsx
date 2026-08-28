"use client";

import * as React from "react";
import {
  Loader2, Sparkles, ShieldAlert, ShieldCheck, ShieldQuestion, Send,
  BookPlus, Globe,
} from "lucide-react";
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
  addCoachEvidence,
  applyCoachProposal,
  coachResume,
  type CoachMessage,
  type CoachProposal,
  type EvidenceDraft,
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
 *
 * The second thing on screen here is evidence capture, and it is deliberately
 * shaped to look nothing like a rewrite. A rewrite edits a sentence; recording
 * evidence changes what every future resume is allowed to say. So a draft card
 * shows the candidate's own words back to them as the source, states the
 * classification in plain language, and says outright that the claim lands
 * unapproved — because the honest thing to promise is that saving this does not
 * put it on a resume.
 */

const CLASSIFICATION_LABEL: Record<string, string> = {
  PRESENT_AND_EXPLICIT: "Work you did",
  LEARNED_OR_ACADEMIC: "Studied or certified",
  IN_PROGRESS_OR_DESIGNED: "Designed, not delivered",
};

function EvidenceCard({
  draft,
  onSave,
  saving,
  saved,
}: {
  draft: EvidenceDraft;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
      <div className="flex items-center gap-2">
        <BookPlus className="size-3.5 text-primary" strokeWidth={1.75} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
          Not in your evidence yet
        </span>
      </div>

      <p className="mt-2 text-sm text-foreground">{draft.claim}</p>

      <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">Employer</dt>
          <dd className="text-foreground">{draft.employer}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">Recorded as</dt>
          <dd className="text-foreground">
            {CLASSIFICATION_LABEL[draft.classification] ?? draft.classification}
          </dd>
        </div>
        {draft.skills.length > 0 && (
          <div className="flex gap-2">
            <dt className="w-20 shrink-0">Skills</dt>
            <dd className="text-foreground">{draft.skills.join(", ")}</dd>
          </div>
        )}
      </dl>

      {/* Their own words, shown back to them. This is the whole reason the card
          can be trusted: the claim exists because they said so, and here is the
          sentence it came from. */}
      <blockquote className="mt-2 border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">
        &ldquo;{draft.quote}&rdquo;
      </blockquote>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={saving || saved} onClick={onSave}>
          {saving && <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />}
          {saved ? "Saved to vault" : "Save to evidence"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {saved
            ? "Approve it in the Evidence Vault before a resume can use it."
            : "Saves unapproved — no resume can use it until you approve it."}
        </span>
      </div>
    </div>
  );
}

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
  const [drafts, setDrafts] = React.useState<EvidenceDraft[]>([]);
  const [grounded, setGrounded] = React.useState<{ postings: number; skill: string } | null>(null);
  const [needDetail, setNeedDetail] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [applyingId, setApplyingId] = React.useState<string | null>(null);
  const [savingQuote, setSavingQuote] = React.useState<string | null>(null);
  const [savedQuotes, setSavedQuotes] = React.useState<string[]>([]);
  // The turn a draft came from. The server re-verifies the quote against the
  // conversation, so saving one has to send the same words that produced it —
  // not whatever is in the input box by then.
  const [askedAt, setAskedAt] = React.useState<{ instruction: string; history: CoachMessage[] }>({
    instruction: "",
    history: [],
  });

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
    setDrafts([]);
    setGrounded(null);
    setNeedDetail(0);
    setAskedAt({ instruction: text, history: thread });

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
    setDrafts(res.data.evidenceDrafts ?? []);
    setNeedDetail(res.data.draftsNeedingDetail ?? 0);
    setGrounded(res.data.groundedIn?.postings ? res.data.groundedIn : null);
  }

  async function saveDraft(draft: EvidenceDraft) {
    setSavingQuote(draft.quote);
    const res = await addCoachEvidence(
      jobId,
      draft,
      askedAt.instruction,
      askedAt.history,
    );
    setSavingQuote(null);

    if (!res.ok) {
      toast.error("Couldn't record that", {
        description:
          res.reason === "not_connected"
            ? "The CareerOS API isn't reachable — start it on port 8000."
            : "The vault refused it.",
      });
      return;
    }

    setSavedQuotes((q) => [...q, draft.quote]);
    toast.success("Added to your evidence", {
      description:
        "Saved unapproved. Approve it in the Evidence Vault, then re-tailor to use it.",
    });
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
                <li>&ldquo;Make the Python bullet read like someone who&rsquo;s shipped it&rdquo;</li>
                <li>&ldquo;I ran the regressions in Excel at Omnicals&rdquo; — tell it what
                  your evidence is missing and it records it</li>
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

          {/* Said out loud rather than left as a gap. The model's prose
              occasionally counts something it did not return; without this the
              panel just shows fewer cards than the reply promised and there is
              no way to tell whether it was refused or forgotten. */}
          {needDetail > 0 && (
            <p className="pt-1 text-xs text-muted-foreground">
              {needDetail === 1 ? "One more thing" : `${needDetail} more things`} you
              mentioned couldn&rsquo;t be recorded — every claim needs an employer,
              project or issuing body. Say who it was and it can be saved.
            </p>
          )}

          {drafts.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {drafts.length} thing{drafts.length === 1 ? "" : "s"} you mentioned
              </p>
              {drafts.map((draft) => (
                <EvidenceCard
                  key={draft.quote}
                  draft={draft}
                  saving={savingQuote === draft.quote}
                  saved={savedQuotes.includes(draft.quote)}
                  onSave={() => void saveDraft(draft)}
                />
              ))}
            </div>
          )}

          {/* Stated rather than assumed. The candidate should be able to tell
              whether the wording advice had anything behind it — "read 40
              postings" and "read none" are very different turns, and only one
              of them is worth trusting on register. */}
          {grounded && (
            <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Globe className="size-3" strokeWidth={1.75} />
              Wording checked against {grounded.postings} live postings for similar
              roles{grounded.skill ? `, for ${grounded.skill}` : ""}. Vocabulary only —
              nothing from them was claimed.
            </p>
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
