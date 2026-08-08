"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type DiffMode = "original" | "tailored" | "side-by-side";

const modes: { value: DiffMode; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "tailored", label: "Tailored" },
  { value: "side-by-side", label: "Side-by-side" },
];

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: DiffMode;
  onChange: (mode: DiffMode) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={mode}
      onValueChange={(v) => v && onChange(v as DiffMode)}
    >
      {modes.map((m) => (
        <ToggleGroupItem key={m.value} value={m.value}>
          {m.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
