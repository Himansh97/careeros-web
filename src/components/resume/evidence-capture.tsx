"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addClaim, type Classification } from "@/lib/api/evidence";

const CLASSIFICATION_HELP: Record<Classification, string> = {
  PRESENT_AND_EXPLICIT: "You did this, and it shipped. Usable on a resume.",
  LEARNED_OR_ACADEMIC: "Coursework or self-study, not delivered at work.",
  IN_PROGRESS_OR_DESIGNED:
    "Designed or underway, not delivered. Kept for interviews — never written as shipped.",
};

interface EvidenceCaptureProps {
  /**
   * The unmet requirement that prompted this, e.g. "KPI".
   *
   * Omitted when adding a claim from the vault itself rather than from a
   * specific resume gap — same form, same guarantees, no invented context.
   */
  requirement?: string;
  label?: string;
  onAdded?: () => void;
}

/**
 * Turn a resume gap into a vault entry, at the moment the gap is visible.
 *
 * The audit already knows a resume fell short *and which requirement caused
 * it*. Until now that was a dead end — the requirement was unmet, the score
 * stayed down, and the only way to add the missing evidence was an agent
 * session editing a gitignored JSON file.
 *
 * Declining is a first-class answer. "I haven't done this" is the correct
 * response much of the time, and a prompt that only offers a way to say yes
 * is a prompt that manufactures claims.
 */
export function EvidenceCapture({ requirement, label, onAdded }: EvidenceCaptureProps) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [claim, setClaim] = React.useState("");
  const [employer, setEmployer] = React.useState("");
  const [source, setSource] = React.useState("");
  const [classification, setClassification] =
    React.useState<Classification>("PRESENT_AND_EXPLICIT");
  const queryClient = useQueryClient();

  async function save() {
    if (!claim.trim() || !employer.trim()) {
      toast.error("A claim needs text and an employer or project");
      return;
    }
    setSaving(true);
    const res = await addClaim({
      claim: claim.trim(),
      employer_or_project: employer.trim(),
      classification,
      skills: requirement ? [requirement] : [],
      evidence_source:
        source.trim() ||
        (requirement
          ? `Added while reviewing a resume gap: ${requirement}`
          : "Added by candidate in CareerOS"),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error("Couldn't save that claim", {
        description:
          res.reason === "not_connected"
            ? "The CareerOS API isn't reachable — start it on port 8000."
            : res.message ?? "The backend rejected it.",
      });
      return;
    }

    setOpen(false);
    setClaim("");
    setEmployer("");
    setSource("");
    // Scores are memoised against the loaded profile, which the write just
    // invalidated — so everything derived from evidence has to be refetched.
    await queryClient.invalidateQueries({ queryKey: ["resume"] });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    toast.success("Evidence added", {
      description:
        "It's saved unapproved. Approve it in Candidate Profile before it can appear on a resume.",
    });
    onAdded?.();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" strokeWidth={1.75} />
        {label ?? (requirement ? `Add evidence: ${requirement}` : "Add evidence")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{requirement ? "Have you done this?" : "Add to your evidence"}</DialogTitle>
            <DialogDescription>
              {requirement ? (
                <>
                  This posting asks for <strong>{requirement}</strong>, and nothing
                  in your evidence supports it. If you have done it, record it once
                  and every future resume can draw on it. If not, close this — an
                  honest gap is the right answer.
                </>
              ) : (
                <>
                  Everything a resume may assert traces back to this vault. Record
                  it once; every future resume can draw on it.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                What did you do?
              </label>
              <Textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                rows={3}
                placeholder={
                  requirement
                    ? `e.g. Defined and tracked the ${requirement} used to report servicing performance to leadership.`
                    : "e.g. Automated a reconciliation that cut close time from 3 days to same-day."
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Employer or project
                </label>
                <Input
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  placeholder="Supreme Lending"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Where is this recorded?
                </label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="project notes, review, repo"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Did it ship?
              </label>
              <Select
                value={classification}
                onValueChange={(v) => setClassification(v as Classification)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CLASSIFICATION_HELP) as Classification[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.replace(/_/g, " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {CLASSIFICATION_HELP[classification]}
              </p>
            </div>

            <p className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
              Saved unapproved. Nothing reaches a resume until you approve it in
              Candidate Profile, and designed work never can.
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {requirement ? "I haven't done this" : "Cancel"}
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Add to evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
