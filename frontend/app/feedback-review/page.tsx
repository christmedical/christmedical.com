import { notFound } from "next/navigation";
import { FeedbackReviewClient } from "./FeedbackReviewClient";
import { isFeedbackModeDisabled } from "@/lib/feedbackMode";

export default function FeedbackReviewPage() {
  if (isFeedbackModeDisabled()) notFound();
  return <FeedbackReviewClient />;
}
