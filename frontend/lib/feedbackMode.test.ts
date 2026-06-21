import { describe, expect, it, vi } from "vitest";
import { isFeedbackModeEnabled } from "./feedbackMode";

describe("isFeedbackModeEnabled", () => {
  it("is false unless NEXT_PUBLIC_FEEDBACK_MODE=on", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_MODE", "off");
    expect(isFeedbackModeEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_MODE", "on");
    expect(isFeedbackModeEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });
});
