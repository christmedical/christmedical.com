"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  FC_BTN_PRIMARY,
  FC_BTN_SECONDARY,
  FC_ERROR_BANNER,
  FC_FIELD_LABEL,
  FC_INPUT,
  FC_SURFACE,
  FC_TEXTAREA,
} from "@/components/design/fieldClinical";
import { FeedbackProvider, useFeedbackMode } from "@/components/feedback/FeedbackProvider";

function SignInPrompt() {
  const { confirmReviewer, signInError } = useFeedbackMode();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await confirmReviewer(email, displayName);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30 px-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className={`w-full max-w-sm ${FC_SURFACE} space-y-4 p-4 shadow-lg`}
      >
        <h2 className="font-display text-lg font-semibold text-fc-ink">Reviewer sign-in</h2>
        <p className="text-sm text-fc-ink-muted">
          Enter the email the owner enabled for feedback. Your name is shown on notes you leave.
        </p>
        {signInError ? <div className={FC_ERROR_BANNER}>{signInError}</div> : null}
        <label className="block">
          <span className={FC_FIELD_LABEL}>Email</span>
          <input
            className={FC_INPUT}
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            required
            autoFocus
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
        <button type="submit" className={`${FC_BTN_PRIMARY} w-full`} disabled={submitting}>
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

function PinMarkers() {
  const { pagePins, selectPin } = useFeedbackMode();

  return (
    <>
      {pagePins.map((pin, index) => (
        <button
          key={pin.id}
          type="button"
          className="pointer-events-auto absolute z-[10000] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-fc-paper bg-fc-accent text-xs font-bold text-fc-paper shadow-md"
          style={{ left: `${pin.pinX * 100}%`, top: `${pin.pinY * 100}%` }}
          onClick={(ev) => {
            ev.stopPropagation();
            selectPin(pin);
          }}
          aria-label={`Feedback pin ${index + 1}`}
        >
          {index + 1}
        </button>
      ))}
    </>
  );
}

function NotePopover() {
  const { pendingPin, selectedPin, saveNote, closePopover, togglePinDone } = useFeedbackMode();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pendingPin && !selectedPin) return null;

  const left = `${((pendingPin?.pinX ?? selectedPin!.pinX) * 100).toFixed(1)}%`;
  const top = `${((pendingPin?.pinY ?? selectedPin!.pinY) * 100).toFixed(1)}%`;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!pendingPin) return;
    setSaving(true);
    setError(null);
    try {
      await saveNote(note.trim());
      setNote("");
    } catch {
      setError("Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="pointer-events-auto absolute z-[10001] w-72 max-w-[90vw] -translate-x-1/2 translate-y-2"
      style={{ left, top }}
      onClick={(ev) => ev.stopPropagation()}
    >
      <div className={`${FC_SURFACE} space-y-3 p-3 shadow-lg`}>
        {pendingPin ? (
          <form onSubmit={(e) => void onSave(e)} className="space-y-3">
            <p className="font-display text-sm font-medium text-fc-ink">Leave a note</p>
            <textarea
              className={FC_TEXTAREA}
              rows={4}
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              placeholder="What should change here?"
              required
              autoFocus
            />
            {error ? <p className="text-xs text-fc-error-ink">{error}</p> : null}
            <div className="flex gap-2">
              <button type="submit" className={FC_BTN_PRIMARY} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" className={FC_BTN_SECONDARY} onClick={closePopover}>
                Cancel
              </button>
            </div>
          </form>
        ) : selectedPin ? (
          <div className="space-y-3">
            <p className="text-sm text-fc-ink">{selectedPin.note}</p>
            <p className="text-xs text-fc-ink-subtle">
              {selectedPin.reviewerLabel} ·{" "}
              {new Date(selectedPin.createdAt).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={FC_BTN_SECONDARY}
                onClick={() => void togglePinDone(selectedPin)}
              >
                {selectedPin.status === "done" ? "Reopen" : "Mark done"}
              </button>
              <button type="button" className={FC_BTN_SECONDARY} onClick={closePopover}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FeedbackOverlay() {
  const { active, accessState, dropPin } = useFeedbackMode();

  if (!active || accessState !== "granted") return null;

  return (
    <div
      className="fixed inset-0 z-[9998] cursor-crosshair"
      onClick={(ev) => {
        const pinX = ev.clientX / window.innerWidth;
        const pinY = ev.clientY / window.innerHeight;
        dropPin(pinX, pinY);
      }}
    >
      <PinMarkers />
      <NotePopover />
    </div>
  );
}

function FeedbackToggleButton() {
  const { active, accessState, toggleActive, signInError } = useFeedbackMode();

  if (accessState === "denied" && signInError) {
    return (
      <div className="fixed bottom-4 left-4 z-[9999] max-w-xs rounded-lg border border-fc-warn-border bg-fc-warn-bg p-3 text-xs text-fc-warn-ink shadow-lg">
        {signInError}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
      <button
        type="button"
        className={
          active
            ? "rounded-full border border-fc-accent bg-fc-accent px-4 py-2 text-sm font-medium text-fc-paper shadow-lg"
            : "rounded-full border border-fc-border-strong bg-fc-surface px-4 py-2 text-sm font-medium text-fc-ink shadow-lg hover:bg-fc-accent-tint"
        }
        onClick={toggleActive}
      >
        {active ? "Feedback on" : "Feedback"}
      </button>
      <Link
        href="/feedback-review"
        className="rounded-full border border-fc-border bg-fc-surface/90 px-3 py-1.5 text-center text-xs text-fc-ink-muted shadow hover:text-fc-ink"
      >
        Review all
      </Link>
    </div>
  );
}

function FeedbackWidgetInner() {
  const { needsSignIn } = useFeedbackMode();

  return (
    <>
      <FeedbackToggleButton />
      <FeedbackOverlay />
      {needsSignIn ? <SignInPrompt /> : null}
    </>
  );
}

export function FeedbackWidget() {
  return (
    <FeedbackProvider>
      <FeedbackWidgetInner />
    </FeedbackProvider>
  );
}
