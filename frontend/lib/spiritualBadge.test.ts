import { describe, expect, it } from "vitest";
import { spiritualStatusBadgeClass } from "./spiritualBadge";

describe("spiritualStatusBadgeClass", () => {
  it("returns emerald styling for heard", () => {
    expect(spiritualStatusBadgeClass("heard")).toContain("emerald");
  });

  it("returns amber styling for hope", () => {
    expect(spiritualStatusBadgeClass("hope")).toContain("amber");
  });

  it("returns neutral zinc styling for none", () => {
    expect(spiritualStatusBadgeClass("none")).toContain("zinc");
  });
});
