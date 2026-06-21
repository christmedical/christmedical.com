import { describe, expect, it, vi } from "vitest";
import { parseHost } from "./subdomain";

describe("parseHost", () => {
  it("treats apex and www as marketing", () => {
    expect(parseHost("christmedical.com")).toEqual({ kind: "marketing" });
    expect(parseHost("www.christmedical.com")).toEqual({ kind: "marketing" });
  });

  it("treats login and signin as global login", () => {
    expect(parseHost("login.christmedical.com")).toEqual({ kind: "login" });
    expect(parseHost("signin.christmedical.com")).toEqual({ kind: "login" });
  });

  it("maps tenant subdomains", () => {
    expect(parseHost("belize.christmedical.com")).toEqual({
      kind: "tenant",
      tenantSlug: "belize",
    });
    expect(parseHost("cornerstone.christmedical.com")).toEqual({
      kind: "tenant",
      tenantSlug: "cornerstone",
    });
  });

  it("rejects reserved subdomains", () => {
    for (const sub of ["api", "admin", "app"] as const) {
      expect(parseHost(`${sub}.christmedical.com`).kind).toBe("reserved");
    }
  });

  it("supports dev localhost subdomains", () => {
    expect(parseHost("belize.localhost:3000")).toEqual({
      kind: "tenant",
      tenantSlug: "belize",
    });
    expect(parseHost("login.localhost:3000")).toEqual({ kind: "login" });
  });

  it("uses DEV_TENANT_SLUG on bare localhost when set", () => {
    vi.stubEnv("DEV_TENANT_SLUG", "demo");
    expect(parseHost("localhost:3000")).toEqual({ kind: "tenant", tenantSlug: "demo" });
    vi.unstubAllEnvs();
  });

  it("treats bare localhost as marketing when DEV_TENANT_SLUG is unset", () => {
    vi.stubEnv("DEV_TENANT_SLUG", "");
    expect(parseHost("localhost:3000")).toEqual({ kind: "marketing" });
    vi.unstubAllEnvs();
  });
});
