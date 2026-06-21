import { describe, expect, it, vi } from "vitest";
import { DEMO_TENANT_SLUG, demoLoginHref, isDemoLoginPrefill } from "./demoAuth";

vi.mock("./subdomain", () => ({
  loginOrigin: () => "https://login.christmedical.com",
}));

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

  it("builds demo login href with tenant and returnTo", () => {
    expect(demoLoginHref("/queue")).toBe(
      "https://login.christmedical.com?tenant=demo&returnTo=%2Fqueue",
    );
  });
});
