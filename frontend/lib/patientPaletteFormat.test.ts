import { describe, expect, it } from "vitest";
import { formatPaletteMetaLine, patientInitials } from "@/lib/patientPaletteFormat";
import type { PatientDto } from "@/lib/patientTypes";

function patient(partial: Partial<PatientDto> & Pick<PatientDto, "id" | "displayName">): PatientDto {
  return {
    legacyId: null,
    displayId: null,
    dateOfBirth: null,
    calculatedAge: null,
    gender: null,
    hopeGospel: false,
    heardGospelDate: null,
    spiritualStatusLabel: "No spiritual record",
    spiritualStatusKind: "none",
    spiritualNotes: null,
    medicalHistory: null,
    surgicalHistory: null,
    familyHistory: null,
    drugAllergies: null,
    ...partial,
  };
}

describe("patientPaletteFormat", () => {
  it("formats meta line like the search modal screenshot", () => {
    const line = formatPaletteMetaLine(
      patient({
        id: "1",
        displayName: "Marisol Coc",
        dateOfBirth: "1991-03-14",
        calculatedAge: 35,
        displayId: "HC-AB-01-0001",
      }),
      "Silk Grass",
    );
    expect(line).toBe("14 Mar 1991 · 35y · HC-AB-01-0001 · Silk Grass");
  });

  it("derives two-letter initials", () => {
    expect(patientInitials("Marisol Coc")).toBe("MC");
    expect(patientInitials("Jon")).toBe("JO");
  });
});
