import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientDto } from "@/lib/patientTypes";
import { useOnlineStatus } from "@/lib/onlineStatus";
import { PatientChart } from "./PatientChart";

import { PatientChart } from "./PatientChart";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/onlineStatus", () => ({
  getIsOnline: () => true,
  subscribeOnlineStatus: () => () => {},
  useOnlineStatus: vi.fn(() => true),
}));

const P2 = "22222222-2222-2222-2222-222222222222";

function patient(partial: Partial<PatientDto> & Pick<PatientDto, "id" | "displayName">): PatientDto {
  return {
    legacyId: partial.legacyId ?? "LEG",
    displayId: partial.displayId ?? null,
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

describe("PatientChart", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5050/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("sends PATCH when Save is clicked", async () => {
    const updated = patient({
      id: P2,
      displayName: "Bob Beta",
      spiritualNotes: "Saved note",
    });

    const listJson = [
      patient({
        id: P2,
        displayName: "Bob Beta",
        spiritualNotes: "Note two",
      }),
    ];

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = init?.method ?? "GET";

        if (method === "PATCH" && url.includes(P2)) {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => updated,
          } as Response;
        }

        if (url.includes(`/patients/${P2}/visits`)) {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => [],
          } as Response;
        }

        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => listJson,
        } as Response;
      },
    );
    globalThis.fetch = fetchMock as typeof fetch;

    render(<PatientChart patientId={P2} />);

    const spiritual = await screen.findByLabelText(/Spiritual check-up notes/i);
    fireEvent.change(spiritual, { target: { value: "Saved note" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        (c) => (c[1] as RequestInit | undefined)?.method === "PATCH",
      );
      expect(patchCall).toBeDefined();
    });
  });

  it("does not PATCH when offline and shows offline save error", async () => {
    vi.mocked(useOnlineStatus).mockReturnValue(false);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [
          patient({
            id: P2,
            displayName: "Bob Beta",
            spiritualNotes: "Note two",
          }),
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [],
      });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<PatientChart patientId={P2} />);

    const spiritual = await screen.findByLabelText(/Spiritual check-up notes/i);
    fireEvent.change(spiritual, { target: { value: "Offline edit" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          /Offline — saving is paused\. Your edits are kept on this device until you reconnect\./,
        ),
      ).toBeInTheDocument(),
    );
    const patchCalls = fetchMock.mock.calls.filter(
      (c) => (c[1] as RequestInit | undefined)?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(0);
  });
});
