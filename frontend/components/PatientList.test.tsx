import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientDto } from "@/lib/patientTypes";
import { PatientList } from "./PatientList";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const P1 = "11111111-1111-1111-1111-111111111111";
const P2 = "22222222-2222-2222-2222-222222222222";

function patient(partial: Partial<PatientDto> & Pick<PatientDto, "id" | "displayNameMasked">): PatientDto {
  return {
    legacyId: partial.legacyId ?? "LEG",
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
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:5050/api/v1/patients?tenantId=1&limit=2000",
    );
  });

  it("renders patient rows after successful fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [
        patient({ id: P1, displayNameMasked: "A***" }),
        patient({
          id: P2,
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
      screen.getByRole("heading", { name: /Belize — patients/i }),
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
        patient({ id: P1, displayNameMasked: "A***", spiritualNotes: "Note one" }),
        patient({ id: P2, displayNameMasked: "B***", spiritualNotes: "Note two" }),
      ],
    }) as typeof fetch;

    render(<PatientList />);
    const bCell = await screen.findByRole("cell", { name: "B***" });
    fireEvent.click(bCell.closest("tr")!);
    await waitFor(() => expect(screen.getByText("Note two")).toBeInTheDocument());
  });

  it("sends PATCH when Save is clicked", async () => {
    const updated = patient({
      id: P2,
      displayNameMasked: "B***",
      spiritualNotes: "Saved note",
      spiritualStatusKind: "none",
      spiritualStatusLabel: "No spiritual record",
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [
          patient({ id: P1, displayNameMasked: "A***" }),
          patient({
            id: P2,
            displayNameMasked: "B***",
            spiritualNotes: "Note two",
          }),
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => updated,
      });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<PatientList />);
    const bCell = await screen.findByRole("cell", { name: "B***" });
    fireEvent.click(bCell.closest("tr")!);

    const spiritual = await screen.findByLabelText(/Spiritual check-up notes/i);
    fireEvent.change(spiritual, { target: { value: "Saved note" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const patchCall = fetchMock.mock.calls[1];
    expect(patchCall?.[0]).toBe(
      `http://localhost:5050/api/v1/patients/${P2}?tenantId=1`,
    );
    expect((patchCall?.[1] as RequestInit)?.method).toBe("PATCH");
  });
});
