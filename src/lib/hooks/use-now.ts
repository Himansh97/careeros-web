"use client";

import * as React from "react";

/**
 * A clock that re-renders its subscribers once a second.
 *
 * Two constraints shape this, and neither is optional.
 *
 * **Hydration.** `new Date()` on the server and `new Date()` on the client are
 * different numbers, so rendering the time directly makes React discard the
 * server HTML and warn. `getServerSnapshot` returns 0, the first client render
 * returns 0 too — `getSnapshot` runs before `subscribe` — and the real time
 * only arrives on the subscription's first tick. Callers render a placeholder
 * while the value is 0.
 *
 * **The React Compiler.** Writing state from inside an effect is a lint error
 * in this codebase, which rules out the usual `useEffect` + `setInterval` +
 * `setNow`. `useSyncExternalStore` over a module-level store is the supported
 * shape, and it has the side benefit that every countdown on the page ticks off
 * one shared interval instead of one each.
 *
 * The interval is torn down when the last subscriber leaves, so a page with no
 * clock on it is not paying for one.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let snapshot = 0;

function tick(): void {
  // Second granularity, so a listener that re-renders on every change is
  // re-rendering once a second and not on every millisecond the clock is read.
  const next = Math.floor(Date.now() / 1000) * 1000;
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (timer === null) {
    timer = setInterval(tick, 1000);
    // Fire immediately so the placeholder is replaced on the next frame rather
    // than up to a second later.
    tick();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => 0;

/**
 * Current time in epoch milliseconds, updated once a second.
 *
 * Returns 0 on the server and on the first client render. Treat 0 as "not
 * known yet" and render a placeholder — it is never a real time.
 */
export function useNowMs(): number {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
