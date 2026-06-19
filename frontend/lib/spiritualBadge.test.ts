import { describe, expect, it } from "vitest";
import { spiritualStatusBadgeClass } from "./spiritualBadge";

describe("spiritualStatusBadgeClass", () => {
  it("maps heard to Field Clinical status tokens", () => {
    expect(spiritualStatusBadgeClass("heard")).toContain("fc-status-heard");
  });

  it("maps hope to Field Clinical status tokens", () => {
    expect(spiritualStatusBadgeClass("hope")).toContain("fc-status-hope");
  });

  it("maps none to Field Clinical status tokens", () => {
    expect(spiritualStatusBadgeClass("none")).toContain("fc-status-none");
  });
});
