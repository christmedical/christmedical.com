import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientDto } from "@/lib/patientTypes";
import { PatientBrowse } from "./PatientList";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("PatientBrowse", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5050/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("debounces search API calls while typing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [] as PatientDto[],
    });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<PatientBrowse embedded />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "maria" } });

    await waitFor(
      () => {
        const hit = fetchMock.mock.calls.some((c) => String(c[0]).includes("q=maria"));
        expect(hit).toBe(true);
      },
      { timeout: 2000 },
    );
  });
});
