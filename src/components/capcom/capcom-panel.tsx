"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Radio, X, ChevronRight } from "lucide-react";
import { EvaFigure } from "@/components/review/eva-figure";
import { useCapcom, type CapcomLine } from "@/lib/hooks/use-capcom";

/**
 * CAPCOM — the one voice that talks to the crew.
 *
 * An assistant that follows you across the app and reports what the stations
 * are actually saying about the screen you are on. It is the loudest thing in
 * the interface, so it is also the place where a persona would do the most
 * damage: one line of encouragement beside "no responses yet" and the whole
 * product's claim to honesty is gone. Every line here is a reading, carries the
 * station it came from, and links to where you would act on it.
 *
 * Docked rather than floating over content, dismissible, and remembered — an
 * assistant you cannot get rid of is not an assistant. Opens on `.` and closes
 * on Escape.
 */
const TONE: Record<CapcomLine["tone"], string> = {
  nominal: "text-success",
  caution: "text-warning",
  flat: "text-muted-foreground",
};

const STORAGE_KEY = "careeros:capcom-open";

/**
 * The open/closed preference, read straight from localStorage.
 *
 * `useSyncExternalStore` rather than an effect: React Compiler is on, and
 * calling setState inside an effect is a lint error here for good reason — it
 * triggers a cascading render, which for this panel means visibly flashing open
 * for someone who had closed it. The server snapshot returns closed so nothing
 * is rendered during SSR that the client then has to take away.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function setOpenState(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Private browsing. Losing the preference is not worth failing over.
  }
  listeners.forEach((l) => l());
}

export function CapcomPanel() {
  const reduced = useReducedMotion();
  const { lines, loading } = useCapcom();
  const open = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = React.useCallback((next: boolean) => setOpenState(next), []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName);
      if (typing) return;
      if (e.key === "Escape") toggle(false);
      if (e.key === ".") {
        e.preventDefault();
        toggle(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, toggle]);

  const urgent = lines.some((l) => l.tone === "caution");

  return (
    <>
      {/* Collapsed: a call button that says whether anything needs attention. */}
      {!open && (
        <button
          onClick={() => toggle(true)}
          aria-label="Open CAPCOM"
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-6"
        >
          <span className="relative flex size-2">
            {urgent && (
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-warning/70" />
            )}
            <span
              className={`relative inline-flex size-2 rounded-full ${
                urgent ? "bg-warning" : "bg-success"
              }`}
            />
          </span>
          <Radio className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Capcom
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.aside
            role="complementary"
            aria-label="CAPCOM status"
            className="fixed bottom-20 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-lg md:bottom-6"
            initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
              <span className="size-8 shrink-0 text-primary">
                <EvaFigure className="h-8 w-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  Capcom
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Relaying what the stations report
                </p>
              </div>
              <button
                onClick={() => toggle(false)}
                aria-label="Close CAPCOM"
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" strokeWidth={1.75} />
              </button>
            </header>

            <div className="max-h-[50vh] overflow-y-auto p-3">
              {loading ? (
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Polling stations…
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {lines.map((line, i) => (
                    <motion.li
                      key={`${line.station}-${i}`}
                      initial={reduced ? false : { opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: reduced ? 0 : i * 0.06 }}
                    >
                      <p
                        className={`font-mono text-[10px] uppercase tracking-[0.16em] ${TONE[line.tone]}`}
                      >
                        {line.station}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-foreground">
                        {line.text}
                      </p>
                      {line.href && line.action && (
                        <Link
                          href={line.href}
                          className="mt-1 inline-flex items-center gap-0.5 text-xs text-primary underline-offset-4 hover:underline"
                        >
                          {line.action}
                          <ChevronRight className="size-3" strokeWidth={1.75} />
                        </Link>
                      )}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <p className="border-t border-border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
              Every line is a reading · press . to toggle
            </p>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
