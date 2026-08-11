"use client";

import * as React from "react";

/**
 * Delay a fast-changing value until it settles.
 *
 * The jobs page fed its search box straight into a TanStack `queryKey`, so
 * every keystroke started a fresh search — and on this backend a search is not
 * cheap: it fetches the whole US pool, title-prescreens it, then deep-scores
 * the survivors. Typing "analyst" fired seven of those.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = React.useState(value);

  React.useEffect(() => {
    const id = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return settled;
}
