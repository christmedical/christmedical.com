import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { isFeedbackModeEnabled } from "@/lib/feedbackMode";

export function FeedbackModeHost() {
  if (!isFeedbackModeEnabled()) return null;
  return <FeedbackWidget />;
}
