"use client";

import { useCallback, useEffect, useState } from "react";

/** Viewport below this width auto-collapses the nav rail (icon-only). */
export const NAV_RAIL_AUTO_COLLAPSE_MAX_PX = 1023;

export type NavRailManualMode = "expanded" | "collapsed" | null;

function readNarrowViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(`(max-width: ${NAV_RAIL_AUTO_COLLAPSE_MAX_PX}px)`).matches;
}

function isCollapsed(manual: NavRailManualMode, narrow: boolean): boolean {
  if (manual === "collapsed") return true;
  if (manual === "expanded") return false;
  return narrow;
}

/**
 * Width-driven auto-collapse plus optional manual override (session memory only).
 */
export function useNavRailCollapse() {
  const [manual, setManual] = useState<NavRailManualMode>(null);
  const [narrow, setNarrow] = useState(readNarrowViewport);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mq = window.matchMedia(`(max-width: ${NAV_RAIL_AUTO_COLLAPSE_MAX_PX}px)`);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const collapsed = isCollapsed(manual, narrow);

  const toggleManual = useCallback(() => {
    setManual((prev) => {
      const currentlyCollapsed = isCollapsed(prev, narrow);
      return currentlyCollapsed ? "expanded" : "collapsed";
    });
  }, [narrow]);

  return { collapsed, toggleManual, narrow, manual };
}
