import { afterEach, describe, expect, it, vi } from "vitest";
import { isIosOrIpados, isStandaloneDisplayMode } from "./pwaPlatform";

describe("isIosOrIpados", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true for iPhone user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      platform: "iPhone",
    });
    expect(isIosOrIpados()).toBe(true);
  });

  it("returns false for typical desktop Chrome", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
      platform: "Win32",
      maxTouchPoints: 0,
    });
    expect(isIosOrIpados()).toBe(false);
  });
});

describe("isStandaloneDisplayMode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when display-mode standalone matches", () => {
    vi.stubGlobal("window", {
      matchMedia: (q: string) => ({
        matches: q === "(display-mode: standalone)",
        media: q,
      }),
    });
    vi.stubGlobal("navigator", { standalone: false });
    expect(isStandaloneDisplayMode()).toBe(true);
  });

  it("returns true for legacy iOS navigator.standalone", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false, media: "" }),
    });
    vi.stubGlobal("navigator", { standalone: true });
    expect(isStandaloneDisplayMode()).toBe(true);
  });
});
