"use client";

import { useState } from "react";
import { AlertTriangle, Info, Pencil, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ResumeBullet as ResumeBulletType } from "@/types/resume";

const changeLabel: Record<string, string> = {
  added: "Added",
  reworded: "Reworded",
  reordered: "Reordered",
};

interface ResumeBulletProps {
  bullet: ResumeBulletType;
  mode: "tailored" | "original" | "side-by-side";
  /** Omit to render read-only (side-by-side and original views). */
  onSave?: (claimId: string, text: string) => Promise<string[]>;
  onRevert?: (claimId: string) => Promise<void>;
}

export function ResumeBullet({ bullet, mode, onSave, onRevert }: ResumeBulletProps) {
  const [editing, setEditing] = useState(false);
  const changed = bullet.changeType !== "unchanged";
  const showOriginalOnly = mode === "original";
  const displayText = showOriginalOnly ? bullet.originalText ?? bullet.text : bullet.text;

  // Editing only makes sense against the tailored view — the other modes show
  // history, and letting someone type into a diff would be ambiguous about
  // which side they meant.
  const canEdit = mode === "tailored" && Boolean(onSave);

  if (editing && onSave) {
    return (
      <li className="rounded-md border border-primary/40 bg-accent/30 p-2">
        <BulletEditor
          bullet={bullet}
          onSave={onSave}
          onRevert={onRevert}
          onClose={() => setEditing(false)}
        />
      </li>
    );
  }

  if (mode === "side-by-side" && changed) {
    return (
      <li className="grid grid-cols-1 gap-3 rounded-md bg-accent/40 p-2 sm:grid-cols-2">
        <div className="text-xs text-muted-foreground line-through decoration-muted-foreground/40">
          {bullet.originalText ?? <span className="italic">(new)</span>}
        </div>
        <BulletBody bullet={bullet} text={bullet.text} changed />
      </li>
    );
  }

  return (
    <li
      className={cn(
        "group rounded-md p-2",
        changed && !showOriginalOnly && "bg-accent/40",
        bullet.unverified && "ring-1 ring-warning/40"
      )}
    >
      <BulletBody
        bullet={bullet}
        text={displayText}
        changed={changed && !showOriginalOnly}
        onEdit={canEdit ? () => setEditing(true) : undefined}
      />
    </li>
  );
}

function BulletEditor({
  bullet,
  onSave,
  onRevert,
  onClose,
}: {
  bullet: ResumeBulletType;
  onSave: (claimId: string, text: string) => Promise<string[]>;
  onRevert?: (claimId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState(bullet.text);
  const [warnings, setWarnings] = useState<string[]>(bullet.verificationWarnings ?? []);
  const [saving, setSaving] = useState(false);

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const dirty = text.trim() !== bullet.text.trim();

  async function save() {
    if (!text.trim() || saving) return;
    setSaving(true);
    const found = await onSave(bullet.id, text.trim());
    setSaving(false);
    setWarnings(found);
    // Warnings don't block the save — they're advisory — so close either way
    // and let the unverified badge carry the signal on the resume itself.
    onClose();
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus
        className="text-sm leading-relaxed"
        aria-label="Edit bullet text"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void save();
        }}
      />

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          <div>
            <p className="font-medium">Goes beyond your evidence file</p>
            <ul className="mt-0.5 list-disc pl-4 text-warning/80">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="mt-1 text-warning/70">
              Saved anyway — it&rsquo;s your history. Add it to career_evidence.json to
              clear this.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs tabular-nums",
            words > 42 ? "text-warning" : "text-muted-foreground"
          )}
        >
          {words} words{words > 42 && " — long for one bullet"}
        </span>
        <div className="flex items-center gap-1.5">
          {bullet.editedBy === "user" && onRevert && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await onRevert(bullet.id);
                onClose();
              }}
            >
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
              Revert
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || saving || !text.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BulletBody({
  bullet,
  text,
  changed,
  onEdit,
}: {
  bullet: ResumeBulletType;
  text: string;
  changed: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
      <p className="flex-1 text-sm leading-relaxed text-foreground">
        {text}
        {bullet.editedBy === "user" && (
          <span className="ml-1.5 align-middle text-[10px] uppercase tracking-wide text-muted-foreground">
            edited
          </span>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {bullet.unverified && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-warning hover:bg-warning/10"
                aria-label="Unverified claim"
              >
                <AlertTriangle className="size-3.5" strokeWidth={1.75} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-1.5 text-sm" side="left">
              <p className="font-medium">Not backed by your evidence file</p>
              <ul className="list-disc pl-4 text-muted-foreground">
                {(bullet.verificationWarnings ?? []).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                This is your edit, so it stays. But if a recruiter asks, nothing in{" "}
                <code className="text-xs">career_evidence.json</code> supports it yet.
              </p>
            </PopoverContent>
          </Popover>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Edit this bullet"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
        )}
        {changed && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Why this changed"
              >
                <Info className="size-3.5" strokeWidth={1.75} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm" side="left">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Badge variant="secondary" className="font-normal">
                  {changeLabel[bullet.changeType]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {bullet.whyChanged ?? "Reworded for relevance to this role."}
              </p>
            </PopoverContent>
          </Popover>
        )}
        {bullet.evidence && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-primary hover:bg-primary/10"
                aria-label="View evidence"
              >
                <ShieldCheck className="size-3.5" strokeWidth={1.75} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-2 text-sm" side="left">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Source
                </span>
                <p className="text-foreground">{bullet.evidence.source}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Verified statement
                </span>
                <p className="text-muted-foreground">&ldquo;{bullet.evidence.verifiedStatement}&rdquo;</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Used to support
                </span>
                <p className="text-foreground">{bullet.evidence.usedToSupport}</p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
