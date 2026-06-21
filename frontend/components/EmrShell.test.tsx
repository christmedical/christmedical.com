import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteContext";
import { EmrShell } from "./emr/EmrShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/queue",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/tenantRuntime", () => ({
  getTenantId: () => "demo",
}));

vi.mock("@/lib/tenantConfig", () => ({
  getTenantBranding: () => ({ name: "Demo Mission", shortName: "Demo" }),
}));

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    () =>
      ({
        matches,
        media: "(max-width: 1023px)",
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as MediaQueryList,
  );
}

describe("EmrShell", () => {
  it("renders workflow navigation links", () => {
    mockMatchMedia(false);
    render(
      <CommandPaletteProvider>
        <EmrShell>
          <div>content</div>
        </EmrShell>
      </CommandPaletteProvider>,
    );
    expect(screen.getByRole("button", { name: /Search patients/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Patient queue/ })).toHaveAttribute("href", "/queue");
    expect(screen.getByRole("link", { name: /Check-in/ })).toHaveAttribute("href", "/check-in");
    expect(screen.getByRole("link", { name: /Patients/ })).toHaveAttribute("href", "/patients");
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/settings");
  });

  it("shows aria-labels on nav links when auto-collapsed", () => {
    mockMatchMedia(true);
    render(
      <CommandPaletteProvider>
        <EmrShell>
          <div>content</div>
        </EmrShell>
      </CommandPaletteProvider>,
    );
    expect(screen.getByRole("link", { name: "Patient queue" })).toBeInTheDocument();
    expect(screen.queryByText("Clinical")).not.toBeInTheDocument();
    expect(screen.queryByText("Patient queue", { selector: "a span" })).not.toBeInTheDocument();
  });
});
