/** Matches API `FEEDBACK_MODE=on`. Default off — never enable in real clinic deploys. */
export function isFeedbackModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEEDBACK_MODE === "on";
}
