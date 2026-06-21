import { notFound } from "next/navigation";
import { FeedbackReviewClient } from "./FeedbackReviewClient";
import { isFeedbackModeEnabled } from "@/lib/feedbackMode";

export default function FeedbackReviewPage() {
  if (!isFeedbackModeEnabled()) notFound();
  return <FeedbackReviewClient />;
}
