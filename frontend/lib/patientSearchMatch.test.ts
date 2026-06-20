import { describe, expect, it } from "vitest";
import type { PatientSearchRecord } from "@/lib/patientSearchMatch";
import { filterPatientsLocalAdvanced, patientMatchesQuery } from "@/lib/patientSearchMatch";

function row(
  partial: Partial<PatientSearchRecord> & Pick<PatientSearchRecord, "id" | "displayName">,
): PatientSearchRecord {
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
    community: null,
    firstNamePhonetic: null,
    lastNamePhonetic: null,
    ...partial,
  };
}

describe("patientSearchMatch phonetic false-negative guards", () => {
  const belizeCases: Array<{
    label: string;
    patient: PatientSearchRecord;
    query: string;
    spiritual?: "all" | "heard" | "hope" | "none";
  }> = [
    {
      label: "Kok → Coc (screenshot case)",
      patient: row({
        id: "1",
        displayName: "Marisol Coc",
        firstNamePhonetic: "MRSL",
        lastNamePhonetic: "KK",
        spiritualStatusKind: "hope",
        hopeGospel: true,
        spiritualStatusLabel: "Hope / Gospel noted",
      }),
      query: "Kok",
      spiritual: "all",
    },
    {
      label: "Kok → Choco (screenshot case)",
      patient: row({
        id: "2",
        displayName: "Carlos Choco",
        firstNamePhonetic: "KRLS",
        lastNamePhonetic: "XK",
      }),
      query: "Kok",
    },
    {
      label: "Catherine → Katherine",
      patient: row({
        id: "3",
        displayName: "Katherine Johnson",
        firstNamePhonetic: "K0RN",
        lastNamePhonetic: "JNSN",
      }),
      query: "Catherine",
    },
    {
      label: "Jon → John spelling",
      patient: row({
        id: "4",
        displayName: "Jon Smith",
        firstNamePhonetic: "JN",
        lastNamePhonetic: "SM0",
      }),
      query: "John",
    },
    // TODO(PO): confirm canonical Q'eqchi' chart spellings for these demo rows.
    {
      label: "Q'eqchi' variant — Xol → Shol (TODO PO verify)",
      patient: row({
        id: "5",
        displayName: "Ana Xol",
        firstNamePhonetic: "AN",
        lastNamePhonetic: "XL",
      }),
      query: "Shol",
    },
    // TODO(PO): Garifuna surname spelling variants from Belize charts.
    {
      label: "Garifuna — Palacio → Palacios (TODO PO verify)",
      patient: row({
        id: "6",
        displayName: "Elena Palacios",
        firstNamePhonetic: "ALN",
        lastNamePhonetic: "PLSS",
      }),
      query: "Palacio",
    },
    // TODO(PO): Maya Kekchi / Spanish double-surname patterns.
    {
      label: "Maya — Pop → Popp (TODO PO verify)",
      patient: row({
        id: "7",
        displayName: "Lucia Pop",
        firstNamePhonetic: "LS",
        lastNamePhonetic: "PP",
      }),
      query: "Popp",
    },
  ];

  it.each(belizeCases)(
    "$label: query $query must surface patient",
    ({ patient, query, spiritual = "all" }) => {
      expect(patientMatchesQuery(patient, query, spiritual)).toBe(true);
    },
  );

  it("composes Hope/interest scope with phonetic query (search-filter.png)", () => {
    const patients = [
      row({
        id: "hope",
        displayName: "Marisol Coc",
        firstNamePhonetic: "MRSL",
        lastNamePhonetic: "KK",
        spiritualStatusKind: "hope",
        hopeGospel: true,
      }),
      row({
        id: "none",
        displayName: "Carlos Choco",
        firstNamePhonetic: "KRLS",
        lastNamePhonetic: "XK",
        spiritualStatusKind: "none",
      }),
    ];
    const hits = filterPatientsLocalAdvanced(patients, "Kok", "hope");
    expect(hits.map((p) => p.id)).toEqual(["hope"]);
  });

  it("does not surface unrelated names for Kok", () => {
    const patients = [
      row({ id: "x", displayName: "Maria Lopez", firstNamePhonetic: "MR", lastNamePhonetic: "LPS" }),
    ];
    expect(filterPatientsLocalAdvanced(patients, "Kok", "all")).toHaveLength(0);
  });
});
