import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl, patientsListUrl } from "./patientApi";

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
});
