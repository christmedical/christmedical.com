import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientDto } from "@/lib/patientTypes";
import { PatientList } from "./PatientList";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

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

vi.mock("@/lib/authSession", () => ({
  bootstrapAccessToken: vi.fn().mockResolvedValue(null),
  getAccessToken: vi.fn().mockReturnValue(null),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

vi.mock("@/lib/apiFetch", () => ({
  apiFetch: (url: string, init?: RequestInit) => fetch(url, init),
}));

const P1 = "11111111-1111-1111-1111-111111111111";

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

describe("PatientList (search)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    push.mockClear();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5050/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("requests the list endpoint on mount for offline cache", async () => {
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

  it("shows search prompt before querying", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => [],
    }) as typeof fetch;

    render(<PatientList />);
    await waitFor(() =>
      expect(
        screen.getByText(/Enter a name, legacy ID, or DOB/),
      ).toBeInTheDocument(),
    );
  });

  it("navigates to chart when a result is selected", async () => {
    globalThis.fetch = vi.fn(
      async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("/search")) {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => [patient({ id: P1, displayName: "Alice Alpha" })],
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          json: async () => [],
        } as Response;
      },
    ) as typeof fetch;

    render(<PatientList />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "alice" } });

    const row = await screen.findByRole("button", { name: /Alice Alpha/i });
    fireEvent.click(row);

    expect(push).toHaveBeenCalledWith(`/patients/${P1}`);
  });

  it("shows no-match register CTA when search returns empty", async () => {
    globalThis.fetch = vi.fn(
      async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (url.includes("/search")) {
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
          json: async () => [],
        } as Response;
      },
    ) as typeof fetch;

    render(<PatientList />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nobody" } });

    await waitFor(() => expect(screen.getByText("No match found")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /Register new patient/i })).toHaveAttribute(
      "href",
      "/patients/new",
    );
  });
});
