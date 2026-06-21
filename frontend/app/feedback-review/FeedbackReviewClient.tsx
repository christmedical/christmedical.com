"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FC_BTN_SECONDARY,
  FC_PAGE_STACK,
  FC_SURFACE,
  FC_SURFACE_BODY,
  FC_SURFACE_HEADER,
} from "@/components/design/fieldClinical";
import {
  feedbackApiBase,
  fetchFeedbackList,
  patchFeedbackStatus,
  type FeedbackItem,
} from "@/lib/feedbackApi";

export function FeedbackReviewClient() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const base = feedbackApiBase();
    if (!base) {
      setError("NEXT_PUBLIC_API_URL is not set.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchFeedbackList(base));
    } catch {
      setError("Could not load feedback (is FEEDBACK_MODE=on on the API?).");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, FeedbackItem[]>();
    for (const item of items) {
      const list = map.get(item.pagePath) ?? [];
      list.push(item);
      map.set(item.pagePath, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  async function toggleDone(item: FeedbackItem) {
    const base = feedbackApiBase();
    if (!base) return;
    const next = item.status === "done" ? "open" : "done";
    const updated = await patchFeedbackStatus(base, item.id, next);
    setItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
  }

  return (
    <main className="min-h-dvh bg-fc-paper px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-fc-accent">
              Internal review
            </p>
            <h1 className="font-display text-2xl font-semibold text-fc-ink">Feedback notes</h1>
          </div>
          <Link href="/queue" className={FC_BTN_SECONDARY}>
            Back to app
          </Link>
        </header>

        {loading ? <p className="text-sm text-fc-ink-muted">Loading…</p> : null}
        {error ? (
          <p className="rounded-lg border border-fc-error-border bg-fc-error-bg p-3 text-sm text-fc-error-ink">
            {error}
          </p>
        ) : null}

        {!loading && !error && grouped.length === 0 ? (
          <p className="text-sm text-fc-ink-muted">No feedback yet.</p>
        ) : null}

        {grouped.map(([pagePath, notes]) => (
          <section key={pagePath} className={`${FC_SURFACE} ${FC_PAGE_STACK}`}>
            <div className={FC_SURFACE_HEADER}>{pagePath}</div>
            <ul className={`${FC_SURFACE_BODY} divide-y divide-fc-border`}>
              {notes.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                  <p className="text-sm text-fc-ink">{item.note}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fc-ink-subtle">
                    <span>
                      {item.reviewerLabel} · {new Date(item.createdAt).toLocaleString()} · pin (
                      {Math.round(item.pinX * 100)}%, {Math.round(item.pinY * 100)}%)
                    </span>
                    <button
                      type="button"
                      className={FC_BTN_SECONDARY}
                      onClick={() => void toggleDone(item)}
                    >
                      {item.status === "done" ? "Reopen" : "Mark done"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
