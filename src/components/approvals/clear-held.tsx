"use client";

import * as React from "react";
import { toast } from "sonner";
import { ListX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearHeldApprovals } from "@/lib/api/approvals";

/**
 * Clear everything a commit criterion is holding, in one confirmation.
 *
 * The board already names which items cannot proceed. Without this the
 * candidate still dismisses them one card at a time, and a queue that costs six
 * clicks to tidy is a queue that stops being read.
 *
 * Confirmed rather than instant, and the confirmation says what will happen in
 * plain terms — this resolves real records, and "clear" should never be a
 * button someone presses without knowing what it touches.
 */
export function ClearHeld({ count }: { count: number }) {
  const [open, setOpen] = React.useState(false);
  const [working, setWorking] = React.useState(false);

  async function run() {
    setWorking(true);
    const res = await clearHeldApprovals();
    setWorking(false);
    setOpen(false);

    if (!res.ok) {
      toast.error("Couldn't clear held items", {
        description:
          res.reason === "not_connected"
            ? "The CareerOS API isn't reachable — start it on port 8000."
            : "The backend rejected the change.",
      });
      return;
    }
    toast.success(`Cleared ${res.data.cleared}`, {
      description:
        res.data.items
          .slice(0, 3)
          .map((i) => `${i.company} — ${i.heldBy.join(", ")}`)
          .join(" · ") || "Nothing was held.",
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ListX className="size-3.5" strokeWidth={1.75} />
        Clear {count} held
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clear {count} held item{count === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              These are the ones a commit criterion is holding — below the fit
              floor, or a posting that has left its board. They stay on the
              record as rejected rather than being deleted, and nothing else in
              the queue is touched.
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Items marked caution are left alone. A caution is worth knowing about;
            it is not a reason to decide against a role on your behalf.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void run()} disabled={working}>
              {working ? "Clearing…" : `Clear ${count}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
