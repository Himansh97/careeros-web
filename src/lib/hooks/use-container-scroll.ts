"use client";

import { useMotionValue, type MotionValue } from "framer-motion";
import * as React from "react";

/**
 * Scroll progress of the app's actual scrolling element.
 *
 * framer-motion's `useScroll()` with no arguments watches the document, and in
 * this app the document never scrolls: the shell is `h-svh overflow-hidden`
 * with a `<main class="overflow-y-auto">` inside it. So every scroll-linked
 * animation on the review — the tether, the parallax depth, the horizon —
 * was reading a value that never changed. The astronaut sat pinned at one end
 * of its own scroll indicator and the background was static. Nothing was wrong
 * with the animations; they were wired to a scroll that did not exist.
 *
 * A plain listener on the real scroller rather than `useScroll({ container })`,
 * because that option needs a populated ref at mount and the element belongs to
 * the layout, several levels up. This resolves it after mount and needs no
 * state, so nothing re-renders on scroll — the MotionValue drives transforms
 * directly, off the React render path, which is what keeps it at 60fps.
 */
export function useContainerScroll(): MotionValue<number> {
  const progress = useMotionValue(0);

  React.useEffect(() => {
    const el = document.querySelector("main");
    if (!el) return;

    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      progress.set(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    // Content arriving late (a query resolving, an image loading) changes the
    // scrollable height, and without this the progress stays scaled to the
    // shorter page and the figure reaches the end early.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [progress]);

  return progress;
}
