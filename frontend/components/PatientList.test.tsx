import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientDto } from "@/lib/patientTypes";
import { PatientList } from "./PatientList";

function patient(partial: Partial<PatientDto> & Pick<PatientDto, "id" | "displayNameMasked">): PatientDto {
  return {
    legacyId: partial.id,
    dateOfBirth: null,
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

describe("PatientList", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5050/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("shows configuration error when API base URL is missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    render(<PatientList />);
    await waitFor(() =>
      expect(screen.getByText(/NEXT_PUBLIC_API_URL is not set/)).toBeInTheDocument(),
    );
  });

  it("requests the list endpoint with normalized base URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [] as PatientDto[],
    });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<PatientList />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:5050/api/v1/patients");
  });

  it("renders patient rows after successful fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [
        patient({ id: "1", displayNameMasked: "A***" }),
        patient({
          id: "2",
          displayNameMasked: "B***",
          spiritualStatusKind: "heard",
          heardGospelDate: "2024-01-01",
          spiritualStatusLabel: "Heard",
        }),
      ],
    }) as typeof fetch;

    render(<PatientList />);
    const table = await screen.findByRole("table");
    await waitFor(() => {
      expect(within(table).getByText("A***")).toBeInTheDocument();
      expect(within(table).getByText("B***")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: /Belize mission patients/i }),
    ).toBeInTheDocument();
  });

  it("shows API error when response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => ({}),
    }) as typeof fetch;

    render(<PatientList />);
    await waitFor(() =>
      expect(screen.getByText(/API 502 Bad Gateway/)).toBeInTheDocument(),
    );
  });

  it("shows empty state when API returns no rows", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [],
    }) as typeof fetch;

    render(<PatientList />);
    await waitFor(() =>
      expect(
        screen.getByText(/No patients returned\. Run the ETL/),
      ).toBeInTheDocument(),
    );
  });

  it("selects a row and shows details", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [
        patient({ id: "1", displayNameMasked: "A***", spiritualNotes: "Note one" }),
        patient({ id: "2", displayNameMasked: "B***", spiritualNotes: "Note two" }),
      ],
    }) as typeof fetch;

    render(<PatientList />);
    const bCell = await screen.findByRole("cell", { name: "B***" });
    fireEvent.click(bCell.closest("tr")!);
    await waitFor(() => expect(screen.getByText("Note two")).toBeInTheDocument());
  });
});
