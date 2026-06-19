import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmrShell } from "./emr/EmrShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/queue",
}));

vi.mock("@/lib/tenantRuntime", () => ({
  getTenantId: () => "demo",
}));

vi.mock("@/lib/tenantConfig", () => ({
  getTenantBranding: () => ({ name: "Demo Mission", shortName: "Demo" }),
}));

describe("EmrShell", () => {
  it("renders workflow navigation links", () => {
    render(
      <EmrShell>
        <div>content</div>
      </EmrShell>,
    );
    expect(screen.getByRole("link", { name: /Patient queue/ })).toHaveAttribute("href", "/queue");
    expect(screen.getByRole("link", { name: /Check-in/ })).toHaveAttribute("href", "/check-in");
    expect(screen.getByRole("link", { name: /Patients/ })).toHaveAttribute("href", "/patients");
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toHaveAttribute("href", "/settings");
  });
});
