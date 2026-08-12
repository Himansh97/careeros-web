"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Archive, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { retireClaim, updateClaim } from "@/lib/api/evidence";

interface ClaimActionsProps {
  claimId: string;
  classification: string;
  approvedForResume: boolean;
}

/**
 * Approve or retire a claim.
 *
 * Approval is the gate between "something I did" and "something a resume may
 * assert", and it was previously only reachable by editing a gitignored file.
 *
 * Designed work has no approve control at all — not a disabled one. The
 * backend refuses it regardless, and offering a button that always fails
 * suggests the rule is a bug rather than the point.
 */
export function ClaimActions({
  claimId,
  classification,
  approvedForResume,
}: ClaimActionsProps) {
  const [busy, setBusy] = React.useState(false);
  const [confirmRetire, setConfirmRetire] = React.useState(false);
  const queryClient = useQueryClient();

  const designed = classification === "IN_PROGRESS_OR_DESIGNED";

  async function refresh() {
    // A vault write invalidates the loaded profile, and every score memoised
    // against it. Anything derived from evidence has to come back fresh.
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["evidence"] });
    await queryClient.invalidateQueries({ queryKey: ["resume"] });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
  }

  async function approve() {
    setBusy(true);
    const res = await updateClaim(claimId, { approved_for_resume: !approvedForResume });
    setBusy(false);
    if (!res.ok) {
      toast.error("Couldn't update that claim", {
        description: res.message ?? "The backend rejected it.",
      });
      return;
    }
    await refresh();
    toast.success(
      approvedForResume
        ? "Withdrawn from resumes — still on record"
        : "Approved — tailoring can now draw on this"
    );
  }

  async function retire() {
    setBusy(true);
    const res = await retireClaim(claimId);
    setBusy(false);
    setConfirmRetire(false);
    if (!res.ok) {
      toast.error("Couldn't retire that claim");
      return;
    }
    await refresh();
    toast.success("Retired — kept on record, no longer used on resumes");
  }

  if (designed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <AlertTriangle className="size-3" strokeWidth={1.75} />
        Designed — interview only
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => void approve()} disabled={busy}>
          <Check className="size-3.5" strokeWidth={1.75} />
          {approvedForResume ? "Withdraw" : "Approve"}
        </Button>
        {approvedForResume && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setConfirmRetire(true)}
            disabled={busy}
            aria-label="Retire this claim"
          >
            <Archive className="size-3.5" strokeWidth={1.75} />
          </Button>
        )}
      </div>

      <Dialog open={confirmRetire} onOpenChange={setConfirmRetire}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retire this claim?</DialogTitle>
            <DialogDescription>
              It stays in your evidence file and remains available for interview
              conversation — it just stops being used on resumes. Nothing is
              deleted; the record of work you actually did is not ours to destroy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmRetire(false)}>
              Cancel
            </Button>
            <Button onClick={() => void retire()} disabled={busy}>
              Retire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
