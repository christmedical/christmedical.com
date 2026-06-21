"use client";

import { useCallback, useEffect, useState } from "react";

/** Viewport below this width auto-collapses the nav rail (icon-only). */
export const NAV_RAIL_AUTO_COLLAPSE_MAX_PX = 1023;
/** Viewport below this width swaps the nav rail for the mobile workflow bar. */
export const NAV_RAIL_MOBILE_MAX_PX = 767;

export type NavRailManualMode = "expanded" | "collapsed" | null;

function readMaxWidthViewport(maxWidthPx: number): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches;
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
  const [narrow, setNarrow] = useState(() => readMaxWidthViewport(NAV_RAIL_AUTO_COLLAPSE_MAX_PX));
  const [mobile, setMobile] = useState(() => readMaxWidthViewport(NAV_RAIL_MOBILE_MAX_PX));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const autoCollapseMq = window.matchMedia(`(max-width: ${NAV_RAIL_AUTO_COLLAPSE_MAX_PX}px)`);
    const mobileMq = window.matchMedia(`(max-width: ${NAV_RAIL_MOBILE_MAX_PX}px)`);
    const onChange = () => {
      setNarrow(autoCollapseMq.matches);
      setMobile(mobileMq.matches);
    };
    onChange();
    autoCollapseMq.addEventListener("change", onChange);
    mobileMq.addEventListener("change", onChange);
    return () => {
      autoCollapseMq.removeEventListener("change", onChange);
      mobileMq.removeEventListener("change", onChange);
    };
  }, []);

  const collapsed = isCollapsed(manual, narrow);

  const toggleManual = useCallback(() => {
    setManual((prev) => {
      const currentlyCollapsed = isCollapsed(prev, narrow);
      return currentlyCollapsed ? "expanded" : "collapsed";
    });
  }, [narrow]);

  return { collapsed, toggleManual, narrow, mobile, manual };
}
