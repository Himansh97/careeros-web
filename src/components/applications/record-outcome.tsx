"use client";

import * as React from "react";
import { toast } from "sonner";
import { CircleSlash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { recordOutcome } from "@/lib/api/applications";
import { pipelineColumns } from "@/types/application";

/**
 * Capture how an application ended, while it is still known.
 *
 * The stage it reached matters more than the outcome itself: "rejected after
 * an interview" and "rejected with no reply at all" are different failures
 * with different fixes, and six months later nobody remembers which was which.
 *
 * The reason field is for what the employer actually said. Guessing is worse
 * than leaving it blank — a stored guess later reads exactly like a stated
 * fact, and this is the data a future analysis would learn from.
 */
export function RecordOutcome({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [outcome, setOutcome] = React.useState<"rejected" | "offer" | "withdrawn">("rejected");
  const [reason, setReason] = React.useState("");
  const [stage, setStage] = React.useState(currentStatus);

  async function save() {
    setSaving(true);
    const res = await recordOutcome(applicationId, outcome, reason, stage);
    setSaving(false);
    if (!res.ok) {
      toast.error("Couldn't record that outcome");
      return;
    }
    setOpen(false);
    toast.success("Outcome recorded", {
      description: "Kept for later analysis, once there are enough to learn from.",
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CircleSlash className="size-3.5" strokeWidth={1.75} />
        Record outcome
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How did this end?</DialogTitle>
            <DialogDescription>
              Recorded now because it is knowable now. How far it got matters more
              than the outcome — rejected after an interview and rejected without a
              reply are different problems.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Outcome</label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="withdrawn">I withdrew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Furthest stage reached
              </label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineColumns
                    .filter((c) => c.value !== "rejected")
                    .map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Reason they gave (optional)
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Only what they actually said"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if they didn&apos;t say. A guess here later reads exactly
                like a fact.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
