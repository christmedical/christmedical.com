import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { isFeedbackModeDisabled } from "@/lib/feedbackMode";

export function FeedbackModeHost() {
  if (isFeedbackModeDisabled()) return null;
  return <FeedbackWidget />;
}
