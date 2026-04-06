import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientDto } from "@/lib/patientTypes";
import { PatientSearch } from "./PatientSearch";

describe("PatientSearch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:5050/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("calls search API when query and Search clicked", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [] as PatientDto[],
    });
    globalThis.fetch = fetchMock as typeof fetch;

    render(<PatientSearch />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "maria" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/v1/patients/search");
    expect(url).toContain("q=maria");
  });

  it("shows validation when no text and spiritual is All", async () => {
    globalThis.fetch = vi.fn() as typeof fetch;
    render(<PatientSearch />);
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(
        screen.getByText(/Enter a name or legacy id, or pick a spiritual filter/i),
      ).toBeInTheDocument(),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
