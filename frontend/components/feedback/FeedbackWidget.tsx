"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { List, MessageSquare } from "lucide-react";
import {
  FC_BTN_PRIMARY,
  FC_BTN_SECONDARY,
  FC_ERROR_BANNER,
  FC_FIELD_LABEL,
  FC_INPUT,
  FC_SURFACE,
  FC_TEXTAREA,
} from "@/components/design/fieldClinical";
import { CommentPinBubble, PlaceCursorBubble } from "@/components/feedback/FeedbackShapes";
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
  const { pagePins, selectedPin, selectPin } = useFeedbackMode();

  return (
    <>
      {pagePins.map((pin, index) => {
        const isSelected = selectedPin?.id === pin.id;
        return (
          <button
            key={pin.id}
            type="button"
            className={`pointer-events-auto absolute z-[10000] -translate-y-1/2 transition-opacity duration-150 ${
              isSelected ? "opacity-100" : "opacity-55 hover:opacity-100"
            }`}
            style={{ left: `${pin.pinX * 100}%`, top: `${pin.pinY * 100}%`, transform: "translate(-2px, -50%)" }}
            onClick={(ev) => {
              ev.stopPropagation();
              selectPin(pin);
            }}
            aria-label={`Feedback note ${index + 1}`}
          >
            <CommentPinBubble label={index + 1} size={40} />
          </button>
        );
      })}
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
      className="pointer-events-auto absolute z-[10001] w-72 max-w-[90vw] translate-x-3 -translate-y-1/2"
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

function FeedbackPlaceCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[10000]"
      style={{ left: pos.x, top: pos.y, transform: "translate(-2px, -2px)" }}
    >
      <PlaceCursorBubble size={36} />
    </div>
  );
}

function FeedbackOverlay() {
  const { active, accessState, dropPin } = useFeedbackMode();

  if (!active || accessState !== "granted") return null;

  return (
    <div
      className="fixed inset-0 z-[9998] cursor-none"
      onClick={(ev) => {
        const pinX = ev.clientX / window.innerWidth;
        const pinY = ev.clientY / window.innerHeight;
        dropPin(pinX, pinY);
      }}
    >
      <FeedbackPlaceCursor />
      <PinMarkers />
      <NotePopover />
    </div>
  );
}

function FeedbackFloatingPill() {
  const { active, accessState, toggleActive, signInError } = useFeedbackMode();

  if (accessState === "denied" && signInError) {
    return (
      <div className="fixed bottom-6 right-6 z-[10002] max-w-xs rounded-xl border border-fc-warn-border bg-fc-warn-bg p-3 text-xs text-fc-warn-ink shadow-lg">
        {signInError}
      </div>
    );
  }

  return (
    <div
      className="group/pill fixed bottom-6 right-6 z-[10002] opacity-50 transition-opacity duration-200 hover:opacity-100"
      aria-label="Feedback tools"
    >
      <div className="flex w-11 flex-col overflow-hidden rounded-full bg-zinc-950 shadow-2xl ring-1 ring-white/10">
        <button
          type="button"
          className={`flex h-11 w-11 items-center justify-center transition-colors ${
            active
              ? "bg-white/15 text-white"
              : "text-zinc-300 hover:bg-white/10 hover:text-white"
          }`}
          onClick={toggleActive}
          aria-label={active ? "Turn off feedback mode" : "Leave feedback"}
          title={active ? "Feedback on" : "Leave feedback"}
        >
          <MessageSquare className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="h-px bg-white/10" aria-hidden />
        <Link
          href="/feedback-review"
          className="flex h-11 w-11 items-center justify-center text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Review all feedback"
          title="Review all"
        >
          <List className="h-5 w-5" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

function FeedbackWidgetInner() {
  const { needsSignIn } = useFeedbackMode();

  return (
    <>
      <FeedbackFloatingPill />
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
