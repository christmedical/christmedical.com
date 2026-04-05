import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl, patientsListUrl, patientsPatchUrl } from "./patientApi";

describe("normalizeApiBaseUrl", () => {
  it("returns empty for undefined", () => {
    expect(normalizeApiBaseUrl(undefined)).toBe("");
  });

  it("trims trailing slashes", () => {
    expect(normalizeApiBaseUrl("http://x/api/")).toBe("http://x/api");
    expect(normalizeApiBaseUrl("http://x/api///")).toBe("http://x/api");
  });

  it("preserves url without trailing slash", () => {
    expect(normalizeApiBaseUrl("http://x/api")).toBe("http://x/api");
  });
});

describe("patientsListUrl", () => {
  it("returns empty when base is empty", () => {
    expect(patientsListUrl("")).toBe("");
  });

  it("appends v1 patients path", () => {
    expect(patientsListUrl("http://localhost:5050/api")).toBe(
      "http://localhost:5050/api/v1/patients",
    );
  });

  it("adds tenantId and limit query params when provided", () => {
    expect(
      patientsListUrl("http://localhost:5050/api", {
        tenantId: 2,
        limit: 2000,
      }),
    ).toBe("http://localhost:5050/api/v1/patients?tenantId=2&limit=2000");
  });
});

describe("patientsPatchUrl", () => {
  it("returns empty when base is empty", () => {
    expect(patientsPatchUrl("", "abc", 1)).toBe("");
  });

  it("includes path and tenantId query", () => {
    expect(
      patientsPatchUrl(
        "http://localhost:5050/api",
        "11111111-1111-1111-1111-111111111111",
        2,
      ),
    ).toBe(
      "http://localhost:5050/api/v1/patients/11111111-1111-1111-1111-111111111111?tenantId=2",
    );
  });
});
