import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RiffleChart } from "./RiffleChart";

describe("RiffleChart", () => {
  const base = {
    patientName: "Test Patient",
    room: "101",
    status: "Stable",
  };

  it("renders closed with collapsed tab semantics", () => {
    render(<RiffleChart {...base} state="closed" />);
    const tab = screen.getByRole("button", { name: /Test Patient/i });
    expect(tab).toHaveAttribute("aria-expanded", "false");
    expect(tab.className).toMatch(/min-h-\[44px\]/);
  });

  it("cycles state when uncontrolled", () => {
    const onStateChange = vi.fn();
    render(
      <RiffleChart
        {...base}
        defaultState="closed"
        onStateChange={onStateChange}
      />,
    );
    const tab = screen.getByRole("button", { name: /Test Patient/i });
    fireEvent.click(tab);
    expect(onStateChange).toHaveBeenLastCalledWith("peek");
    fireEvent.click(tab);
    expect(onStateChange).toHaveBeenLastCalledWith("expanded");
    fireEvent.click(tab);
    expect(onStateChange).toHaveBeenLastCalledWith("closed");
  });
});
