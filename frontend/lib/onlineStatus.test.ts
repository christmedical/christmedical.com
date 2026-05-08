import { afterEach, describe, expect, it, vi } from "vitest";
import { getIsOnline, subscribeOnlineStatus } from "./onlineStatus";

describe("getIsOnline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to true when navigator is unavailable", () => {
    vi.stubGlobal("navigator", undefined as unknown as Navigator);
    expect(getIsOnline()).toBe(true);
  });

  it("returns navigator.onLine when available", () => {
    vi.stubGlobal("navigator", { onLine: false } as unknown as Navigator);
    expect(getIsOnline()).toBe(false);
    vi.stubGlobal("navigator", { onLine: true } as unknown as Navigator);
    expect(getIsOnline()).toBe(true);
  });
});

describe("subscribeOnlineStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls callback immediately and on online/offline events", () => {
    const listeners = new Map<string, (() => void)[]>();

    const addEventListener = (type: string, cb: () => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), cb]);
    };

    const removeEventListener = (type: string, cb: () => void) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((x) => x !== cb),
      );
    };

    vi.stubGlobal("window", {
      addEventListener,
      removeEventListener,
    } as unknown as Window);

    const nav = { onLine: true } as { onLine: boolean };
    vi.stubGlobal("navigator", nav as unknown as Navigator);

    const seen: boolean[] = [];
    const unsub = subscribeOnlineStatus((online) => seen.push(online));

    expect(seen).toEqual([true]);

    nav.onLine = false;
    listeners.get("offline")?.forEach((fn) => fn());
    expect(seen[seen.length - 1]).toBe(false);

    nav.onLine = true;
    listeners.get("online")?.forEach((fn) => fn());
    expect(seen[seen.length - 1]).toBe(true);

    unsub();
    const offlineCount = listeners.get("offline")?.length ?? 0;
    const onlineCount = listeners.get("online")?.length ?? 0;
    expect(offlineCount).toBe(0);
    expect(onlineCount).toBe(0);
  });
});

