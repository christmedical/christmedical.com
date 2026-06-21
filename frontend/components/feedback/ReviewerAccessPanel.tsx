"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  FC_BTN_PRIMARY,
  FC_BTN_SECONDARY,
  FC_FIELD_LABEL,
  FC_INPUT,
  FC_PAGE_STACK,
  FC_SURFACE,
  FC_SURFACE_BODY,
  FC_SURFACE_HEADER,
} from "@/components/design/fieldClinical";
import {
  feedbackApiBase,
  fetchReviewers,
  patchReviewerEnabled,
  upsertReviewer,
  type FeedbackReviewerPref,
} from "@/lib/feedbackApi";

export function ReviewerAccessPanel() {
  const [reviewers, setReviewers] = useState<FeedbackReviewerPref[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const base = feedbackApiBase();
    if (!base) return;
    setLoading(true);
    setError(null);
    try {
      setReviewers(await fetchReviewers(base));
    } catch {
      setError("Could not load reviewer access list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    const base = feedbackApiBase();
    if (!base) return;
    try {
      await upsertReviewer(base, {
        email: email.trim(),
        displayName: displayName.trim(),
        feedbackEnabled: true,
      });
      setEmail("");
      setDisplayName("");
      await load();
    } catch {
      setError("Could not add reviewer.");
    }
  }

  async function toggleReviewer(reviewer: FeedbackReviewerPref) {
    const base = feedbackApiBase();
    if (!base) return;
    try {
      await patchReviewerEnabled(base, reviewer.email, !reviewer.feedbackEnabled);
      await load();
    } catch {
      setError("Could not update reviewer.");
    }
  }

  return (
    <section className={`${FC_SURFACE} ${FC_PAGE_STACK}`}>
      <div className={FC_SURFACE_HEADER}>Reviewer access</div>
      <div className={`${FC_SURFACE_BODY} space-y-4`}>
        <p className="text-sm text-fc-ink-muted">
          Turn feedback on per person. They sign in with this email when using the widget.
        </p>

        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => void onAdd(e)}>
          <label className="block">
            <span className={FC_FIELD_LABEL}>Email</span>
            <input
              className={FC_INPUT}
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={FC_FIELD_LABEL}>Display name</span>
            <input
              className={FC_INPUT}
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
              placeholder="Optional"
            />
          </label>
          <button type="submit" className={`${FC_BTN_PRIMARY} self-end`}>
            Add & enable
          </button>
        </form>

        {error ? (
          <p className="rounded-lg border border-fc-error-border bg-fc-error-bg p-3 text-sm text-fc-error-ink">
            {error}
          </p>
        ) : null}

        {loading ? <p className="text-sm text-fc-ink-muted">Loading reviewers…</p> : null}

        {!loading && reviewers.length === 0 ? (
          <p className="text-sm text-fc-ink-muted">No reviewers yet — add an email above.</p>
        ) : null}

        <ul className="divide-y divide-fc-border">
          {reviewers.map((reviewer) => (
            <li
              key={reviewer.email}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-fc-ink">
                  {reviewer.displayName || reviewer.email}
                </p>
                <p className="text-xs text-fc-ink-subtle">{reviewer.email}</p>
              </div>
              <button
                type="button"
                className={FC_BTN_SECONDARY}
                onClick={() => void toggleReviewer(reviewer)}
              >
                {reviewer.feedbackEnabled ? "Disable feedback" : "Enable feedback"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
