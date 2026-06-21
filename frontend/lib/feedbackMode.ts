/** Global kill switch only. Default on; set NEXT_PUBLIC_FEEDBACK_MODE=off to hide everywhere. */
export function isFeedbackModeDisabled(): boolean {
  return process.env.NEXT_PUBLIC_FEEDBACK_MODE === "off";
}

export function isFeedbackModeEnabled(): boolean {
  return !isFeedbackModeDisabled();
}
