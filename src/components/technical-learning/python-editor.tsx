"use client";

import * as React from "react";
import { Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PythonRunner } from "@/lib/technical-learning/python-runner";

const runner = new PythonRunner();

export function PythonEditor({
  value,
  fixture,
  onChange,
  onOutput,
}: {
  value: string;
  fixture: Record<string, unknown[]>;
  onChange: (value: string) => void;
  onOutput: (output: unknown) => void;
}) {
  const [status, setStatus] = React.useState<"idle" | "running" | "ready" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const run = async () => {
    setStatus("running");
    setMessage("Loading the isolated Python runtime…");
    try {
      const output = await runner.run(value, fixture);
      onOutput(output);
      setStatus("ready");
      setMessage("Output normalized. Check it when you are ready.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Python execution failed.");
    }
  };

  return (
    <div className="grid gap-3">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Python editor"
        spellCheck={false}
        className="min-h-72 resize-y rounded-none bg-card p-4 font-mono text-xs leading-6"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={run} disabled={status === "running" || !value.trim()}>
          <Play className="size-4" /> {status === "running" ? "Starting runtime…" : "Run Python"}
        </Button>
        {status === "error" && <Button variant="ghost" size="sm" onClick={() => { runner.restart(); setStatus("idle"); setMessage("Runtime restarted. Your answer is preserved."); }}><RotateCcw className="size-4" /> Restart runtime</Button>}
        {message && <p role={status === "error" ? "alert" : "status"} className="text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
