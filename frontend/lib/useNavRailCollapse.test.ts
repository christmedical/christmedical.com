import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NAV_RAIL_AUTO_COLLAPSE_MAX_PX,
  useNavRailCollapse,
} from "./useNavRailCollapse";

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const mq = {
    matches,
    media: `(max-width: ${NAV_RAIL_AUTO_COLLAPSE_MAX_PX}px)`,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    dispatch: () => {
      listeners.forEach((fn) => fn());
    },
  };
  vi.stubGlobal("matchMedia", () => mq);
  return mq;
}

describe("useNavRailCollapse", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis.window);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("auto-collapses when viewport is narrow", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(true);
  });

  it("stays expanded on wide viewport", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(false);
  });

  it("manual toggle overrides auto at wide width", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useNavRailCollapse());
    act(() => result.current.toggleManual());
    expect(result.current.collapsed).toBe(true);
    act(() => result.current.toggleManual());
    expect(result.current.collapsed).toBe(false);
  });

  it("reacts live when matchMedia changes", () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useNavRailCollapse());
    expect(result.current.collapsed).toBe(false);
    mq.matches = true;
    act(() => mq.dispatch());
    expect(result.current.collapsed).toBe(true);
  });
});
