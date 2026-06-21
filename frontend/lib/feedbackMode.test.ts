import { describe, expect, it, vi } from "vitest";
import { isFeedbackModeDisabled, isFeedbackModeEnabled } from "./feedbackMode";

describe("feedbackMode", () => {
  it("is enabled by default", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_MODE", undefined);
    expect(isFeedbackModeEnabled()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("is disabled only when explicitly off", () => {
    vi.stubEnv("NEXT_PUBLIC_FEEDBACK_MODE", "off");
    expect(isFeedbackModeDisabled()).toBe(true);
    expect(isFeedbackModeEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });
});
