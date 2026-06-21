import { describe, expect, it } from "vitest";
import { DEMO_TENANT_SLUG, isDemoLoginPrefill } from "./demoAuth";

describe("demoAuth", () => {
  it("prefills when tenant slug is demo", () => {
    expect(isDemoLoginPrefill(DEMO_TENANT_SLUG, null)).toBe(true);
  });

  it("prefills when demo=1 query flag is set", () => {
    expect(isDemoLoginPrefill(null, "1")).toBe(true);
  });

  it("does not prefill for other tenants", () => {
    expect(isDemoLoginPrefill("belize", null)).toBe(false);
  });
});
