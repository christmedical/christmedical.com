import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteContext";
import { EmrShell } from "@/components/emr/EmrShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/patients",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/tenantRuntime", () => ({
  getTenantId: () => 1,
}));

vi.mock("@/lib/tenantConfig", () => ({
  getTenantBranding: () => ({ name: "Belize", shortName: "Belize" }),
}));

vi.mock("@/lib/onlineStatus", () => ({
  useOnlineStatus: () => true,
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }),
  );
});

describe("CommandPalette", () => {
  it("opens from sidebar search button and closes on Escape", async () => {
    render(
      <CommandPaletteProvider>
        <EmrShell>
          <div>content</div>
        </EmrShell>
      </CommandPaletteProvider>,
    );

    const trigger = screen.getByRole("button", { name: /Search patients/ });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: /Search patients/ })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Search patients/ })).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});
