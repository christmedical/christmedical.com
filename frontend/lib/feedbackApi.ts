import { normalizeApiBaseUrl } from "@/lib/patientApi";

export type FeedbackItem = {
  id: string;
  createdAt: string;
  pagePath: string;
  pinX: number;
  pinY: number;
  note: string;
  reviewerLabel: string;
  status: "open" | "done";
  userAgent?: string | null;
  viewportW: number;
  viewportH: number;
};

export type CreateFeedbackBody = {
  pagePath: string;
  pinX: number;
  pinY: number;
  note: string;
  reviewerLabel: string;
  userAgent?: string;
  viewportW: number;
  viewportH: number;
};

function feedbackBase(base: string): string {
  return `${base}/v1/feedback`;
}

export async function fetchFeedbackList(
  base: string,
  status?: "open" | "done",
): Promise<FeedbackItem[]> {
  const url = status
    ? `${feedbackBase(base)}?status=${status}`
    : feedbackBase(base);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Feedback list ${res.status}`);
  return (await res.json()) as FeedbackItem[];
}

export async function createFeedback(
  base: string,
  body: CreateFeedbackBody,
): Promise<FeedbackItem> {
  const res = await fetch(feedbackBase(base), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Feedback create ${res.status}`);
  return (await res.json()) as FeedbackItem;
}

export async function patchFeedbackStatus(
  base: string,
  id: string,
  status: "open" | "done",
): Promise<FeedbackItem> {
  const res = await fetch(`${feedbackBase(base)}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Feedback patch ${res.status}`);
  return (await res.json()) as FeedbackItem;
}

export function feedbackApiBase(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}
