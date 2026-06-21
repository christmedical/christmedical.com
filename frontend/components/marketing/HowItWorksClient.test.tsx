import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HowItWorksClient } from "./HowItWorksClient";

describe("HowItWorksClient", () => {
  it("defaults to the patient journey tab", () => {
    render(<HowItWorksClient />);

    expect(screen.getByRole("tab", { name: /patient journey/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("img", { name: /swimlane diagram/i })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /isometric deployment/i })).not.toBeInTheDocument();
  });

  it("switches to the technical tab and back", async () => {
    const user = userEvent.setup();
    render(<HowItWorksClient />);

    await user.click(screen.getByRole("tab", { name: /for technical teams/i }));

    expect(screen.getByRole("tab", { name: /for technical teams/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("img", { name: /isometric deployment/i })).toBeInTheDocument();
    expect(screen.getByText(/component diagram — coming soon/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /patient journey/i }));

    expect(screen.getByRole("img", { name: /swimlane diagram/i })).toBeInTheDocument();
  });
});
