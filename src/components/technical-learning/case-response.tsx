import { Textarea } from "@/components/ui/textarea";

export function CaseResponse({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Your analysis"
      placeholder="State your assumptions, method, trade-offs, and recommendation…"
      className="min-h-64 resize-y rounded-none bg-card p-4 text-sm leading-6"
    />
  );
}
