"use client";

import * as React from "react";
import { Send, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubmit } from "@/lib/hooks/use-submit";

export interface EligibilityBlocker {
  type?: string;
  detail?: string;
  quote?: string;
}

export interface Eligibility {
  verdict?: string;
  blockers?: EligibilityBlocker[];
}

interface Props {
  jobId: string;
  company: string;
  title: string;
  ats?: string;
  /** When known, the gate is shown before the click rather than after. */
  eligibility?: Eligibility;
  /** Already recorded as submitted in CareerOS. */
  alreadySubmitted?: boolean;
  size?: "sm" | "default";
  onSubmitted?: () => void;
}

/**
 * The one control in CareerOS that sends an application to an employer.
 *
 * Everything about it is shaped by the fact that it cannot be undone. There is
 * no recall, no delete, and no second first impression, so:
 *
 * * It confirms first, naming the company and the role. A dialog is a cheap
 *   price for the one action here that reaches another human.
 * * A blocked eligibility verdict is shown *before* the click, with the actual
 *   wording that triggered it, not a generic "ineligible". Overriding is
 *   possible — it is the candidate's career — but it requires reading the
 *   blocker and pressing a second, differently-worded button.
 * * There is no bulk version of this component, deliberately. Tsenta submits
 *   in two to three seconds; a "submit all" across a 26-role queue would spend
 *   every one of them before the first spinner resolved.
 */
export function SubmitToEmployer({
  jobId,
  company,
  title,
  ats,
  eligibility,
  alreadySubmitted,
  size = "sm",
  onSubmitted,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const { submit, submitting } = useSubmit();

  const verdict = (eligibility?.verdict ?? "").toUpperCase();
  const blocked = verdict !== "" && verdict !== "ELIGIBLE";
  const blockers = eligibility?.blockers ?? [];
  const busy = submitting === jobId;

  async function go(force: boolean) {
    const res = await submit(jobId, { force });
    // The dialog stays open on a refusal so the reason can be read. It closes
    // only once the request was accepted, whatever state it landed in.
    if (res?.ok) {
      setOpen(false);
      onSubmitted?.();
    }
  }

  if (alreadySubmitted) {
    return (
      <Button variant="outline" size={size} disabled>
        <Send className="size-3.5" strokeWidth={1.75} />
        Submitted
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={blocked ? "outline" : "default"} size={size}>
          {blocked ? (
            <ShieldAlert className="size-3.5" strokeWidth={1.75} />
          ) : (
            <Send className="size-3.5" strokeWidth={1.75} />
          )}
          Submit to employer
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {blocked ? "This role is blocked" : "Submit this application?"}
          </DialogTitle>
          <DialogDescription>
            {blocked
              ? "CareerOS will refuse this unless you override it."
              : "Tsenta will fill the employer's form and submit it. This cannot be recalled."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div className="font-medium text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">
              {company}
              {ats ? ` · ${ats}` : ""}
            </div>
          </div>

          {blocked && (
            <div className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-warning">
                <TriangleAlert className="size-3.5" strokeWidth={1.75} />
                {verdict}
              </div>
              {blockers.map((b, i) => (
                <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                  {b.detail}
                  {b.quote ? (
                    <span className="text-foreground"> — “{b.quote}”</span>
                  ) : null}
                </p>
              ))}
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            An application Tsenta holds for review or a verification code has{" "}
            <span className="text-foreground">not</span> been sent. CareerOS records
            it as submitted only when the employer actually has it.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {blocked ? (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void go(true)}
              className="border-warning/50 text-warning hover:text-warning"
            >
              {busy ? "Submitting…" : "Override and submit anyway"}
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => void go(false)}>
              {busy ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
