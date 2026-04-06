import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppNav } from "./AppNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
}));

describe("AppNav", () => {
  it("renders main links", () => {
    render(<AppNav />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Patient search" })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: "Patient list" })).toHaveAttribute("href", "/patients");
  });
});
