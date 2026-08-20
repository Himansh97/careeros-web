"use client";

import * as React from "react";
import { sql } from "@codemirror/lang-sql";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

export function SqlEditor({ value, onChange, onRun }: { value: string; onChange: (value: string) => void; onRun: () => void }) {
  const host = React.useRef<HTMLDivElement>(null);
  const changeRef = React.useRef(onChange);
  const runRef = React.useRef(onRun);

  React.useEffect(() => {
    changeRef.current = onChange;
    runRef.current = onRun;
  }, [onChange, onRun]);

  React.useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          sql(),
          EditorView.lineWrapping,
          EditorView.theme({
            "&": { minHeight: "260px", fontSize: "13px", background: "transparent" },
            ".cm-content": { fontFamily: "var(--font-geist-mono), monospace", padding: "16px" },
            ".cm-gutters": { background: "transparent", border: "none", color: "var(--muted-foreground)" },
            "&.cm-focused": { outline: "2px solid var(--ring)", outlineOffset: "-2px" },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) changeRef.current(update.state.doc.toString());
          }),
          keymap.of([{ key: "Mod-Enter", run: () => { runRef.current(); return true; } }]),
        ],
      }),
    });
    return () => view.destroy();
    // Initial document belongs to the drill; route changes remount the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} aria-label="SQL editor" className="overflow-hidden border border-border bg-card" />;
}
