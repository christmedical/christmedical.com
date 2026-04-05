import { describe, expect, it } from "vitest";
import type { PatientDto } from "./patientTypes";
import { reconcileSelectionAfterLoad } from "./patientSelection";

const row = (id: string, name: string): PatientDto => ({
  id,
  legacyId: id,
  displayNameMasked: name,
  dateOfBirth: null,
  hopeGospel: false,
  heardGospelDate: null,
  spiritualStatusLabel: "none",
  spiritualStatusKind: "none",
  spiritualNotes: null,
  medicalHistory: null,
  surgicalHistory: null,
  familyHistory: null,
  drugAllergies: null,
});

describe("reconcileSelectionAfterLoad", () => {
  it("picks first when no previous selection", () => {
    const data = [row("a", "A"), row("b", "B")];
    expect(reconcileSelectionAfterLoad(null, data)?.id).toBe("a");
  });

  it("returns null for empty list", () => {
    expect(reconcileSelectionAfterLoad(null, [])).toBeNull();
    expect(reconcileSelectionAfterLoad(row("x", "X"), [])).toBeNull();
  });

  it("keeps same id when still present", () => {
    const data = [row("a", "A"), row("b", "B")];
    const prev = row("b", "B");
    expect(reconcileSelectionAfterLoad(prev, data)?.id).toBe("b");
  });

  it("falls back to first when previous id missing", () => {
    const data = [row("a", "A")];
    const prev = row("gone", "G");
    expect(reconcileSelectionAfterLoad(prev, data)?.id).toBe("a");
  });
});
