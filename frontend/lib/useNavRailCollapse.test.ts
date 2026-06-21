import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NAV_RAIL_AUTO_COLLAPSE_MAX_PX,
  NAV_RAIL_MOBILE_MAX_PX,
  useNavRailCollapse,
} from "./useNavRailCollapse";

function createMediaQueryList(query: string, matches: boolean) {
  const listeners = new Set<() => void>();
  return {
    matches,
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    dispatch: () => {
      listeners.forEach((fn) => fn());
    },
  };
}

function mockMatchMedia({
  autoCollapse,
  mobile = autoCollapse,
}: {
  autoCollapse: boolean;
  mobile?: boolean;
}) {
  const autoCollapseQuery = `(max-width: ${NAV_RAIL_AUTO_COLLAPSE_MAX_PX}px)`;
  const mobileQuery = `(max-width: ${NAV_RAIL_MOBILE_MAX_PX}px)`;
  const queries = new Map<string, ReturnType<typeof createMediaQueryList>>();

  vi.stubGlobal("matchMedia", (query: string) => {
    if (!queries.has(query)) {
      queries.set(
        query,
        createMediaQueryList(query, query === mobileQuery ? mobile : autoCollapse),
      );
    }
    return queries.get(query)!;
  });

  return {
    autoCollapse: () => queries.get(autoCollapseQuery),
    mobile: () => queries.get(mobileQuery),
  };
}

describe("useNavRailCollapse", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis.window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("auto-collapses when viewport is narrow", () => {
    mockMatchMedia({ autoCollapse: true, mobile: false });
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(true);
    expect(result.current.mobile).toBe(false);
  });

  it("stays expanded on wide viewport", () => {
    mockMatchMedia({ autoCollapse: false });
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(false);
    expect(result.current.mobile).toBe(false);
  });

  it("reports mobile separately from the collapsed rail state", () => {
    mockMatchMedia({ autoCollapse: true, mobile: true });
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(true);
    expect(result.current.mobile).toBe(true);
  });

  it("manual toggle overrides auto at wide width", () => {
    mockMatchMedia({ autoCollapse: false });
    const { result } = renderHook(() => useNavRailCollapse());
    act(() => result.current.toggleManual());
    expect(result.current.collapsed).toBe(true);
    act(() => result.current.toggleManual());
    expect(result.current.collapsed).toBe(false);
  });

  it("reacts live when matchMedia changes", () => {
    const mq = mockMatchMedia({ autoCollapse: false });
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(false);
    const autoCollapseMq = mq.autoCollapse();
    if (!autoCollapseMq) throw new Error("auto-collapse media query was not registered");
    autoCollapseMq.matches = true;
    act(() => autoCollapseMq.dispatch());
    expect(result.current.collapsed).toBe(true);
  });
});
