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

function mockMatchMedia({
  autoCollapse,
  mobile = autoCollapse,
}: {
  autoCollapse: boolean;
  mobile?: boolean;
}) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query.includes("767px") ? mobile : autoCollapse,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as MediaQueryList,
  );
}

describe("EmrShell", () => {
  it("renders workflow navigation links", () => {
    mockMatchMedia({ autoCollapse: false });
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

  it("shows aria-labels on nav links when auto-collapsed on tablet widths", () => {
    mockMatchMedia({ autoCollapse: true, mobile: false });
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

  it("uses a bottom workflow bar on phone widths", () => {
    mockMatchMedia({ autoCollapse: true, mobile: true });
    render(
      <CommandPaletteProvider>
        <EmrShell>
          <div>content</div>
        </EmrShell>
      </CommandPaletteProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Mobile workflow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search patients" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Patient queue/ })).toHaveAttribute("href", "/queue");
    expect(screen.queryByRole("button", { name: "Collapse navigation" })).not.toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
