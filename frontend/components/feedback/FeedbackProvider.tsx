"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  createFeedback,
  feedbackApiBase,
  fetchFeedbackList,
  fetchReviewerPref,
  patchFeedbackStatus,
  type FeedbackItem,
} from "@/lib/feedbackApi";

type PendingPin = { pinX: number; pinY: number };

type AccessState = "unknown" | "checking" | "granted" | "denied";

type FeedbackContextValue = {
  accessState: AccessState;
  active: boolean;
  beginSignIn: () => void;
  needsSignIn: boolean;
  toggleActive: () => void;
  reviewerEmail: string;
  reviewerLabel: string;
  confirmReviewer: (email: string, displayName: string) => Promise<void>;
  signInError: string | null;
  pagePins: FeedbackItem[];
  pendingPin: PendingPin | null;
  selectedPin: FeedbackItem | null;
  dropPin: (pinX: number, pinY: number) => void;
  saveNote: (note: string) => Promise<void>;
  closePopover: () => void;
  selectPin: (pin: FeedbackItem) => void;
  togglePinDone: (pin: FeedbackItem) => Promise<void>;
  reloadPins: () => Promise<void>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedbackMode(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedbackMode outside FeedbackProvider");
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [accessState, setAccessState] = useState<AccessState>("unknown");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewerLabel, setReviewerLabel] = useState("");
  const [pagePins, setPagePins] = useState<FeedbackItem[]>([]);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [selectedPin, setSelectedPin] = useState<FeedbackItem | null>(null);

  const reloadPins = useCallback(async () => {
    const base = feedbackApiBase();
    if (!base) return;
    try {
      const all = await fetchFeedbackList(base);
      setPagePins(all.filter((item) => item.pagePath === pathname));
    } catch {
      /* offline or API disabled */
    }
  }, [pathname]);

  useEffect(() => {
    if (active && accessState === "granted") void reloadPins();
  }, [active, accessState, pathname, reloadPins]);

  const beginSignIn = useCallback(() => {
    setNeedsSignIn(true);
    setSignInError(null);
  }, []);

  const confirmReviewer = useCallback(async (email: string, displayName: string) => {
    const base = feedbackApiBase();
    if (!base) {
      setSignInError("API is not configured.");
      return;
    }

    setAccessState("checking");
    setSignInError(null);
    try {
      const pref = await fetchReviewerPref(base, email.trim());
      if (!pref.feedbackEnabled) {
        setAccessState("denied");
        setNeedsSignIn(false);
        setSignInError("Feedback is not enabled for this email. Ask the owner to turn it on.");
        return;
      }

      setReviewerEmail(pref.email);
      setReviewerLabel(displayName.trim() || pref.displayName || pref.email);
      setAccessState("granted");
      setNeedsSignIn(false);
      setActive(true);
    } catch {
      setAccessState("denied");
      setSignInError("Could not verify reviewer access.");
    }
  }, []);

  const toggleActive = useCallback(() => {
    if (accessState !== "granted") {
      beginSignIn();
      return;
    }

    setActive((prev) => {
      const next = !prev;
      if (!next) {
        setPendingPin(null);
        setSelectedPin(null);
      }
      return next;
    });
  }, [accessState, beginSignIn]);

  const dropPin = useCallback(
    (pinX: number, pinY: number) => {
      if (accessState !== "granted" || !active) return;
      setSelectedPin(null);
      setPendingPin({ pinX, pinY });
    },
    [accessState, active],
  );

  const closePopover = useCallback(() => {
    setPendingPin(null);
    setSelectedPin(null);
  }, []);

  const saveNote = useCallback(
    async (note: string) => {
      if (!pendingPin) return;
      const base = feedbackApiBase();
      if (!base) return;

      const created = await createFeedback(base, {
        pagePath: pathname,
        pinX: pendingPin.pinX,
        pinY: pendingPin.pinY,
        note,
        reviewerEmail,
        reviewerLabel: reviewerLabel || reviewerEmail,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
      });

      setPagePins((prev) => [...prev, created]);
      setPendingPin(null);
    },
    [pathname, pendingPin, reviewerEmail, reviewerLabel],
  );

  const selectPin = useCallback((pin: FeedbackItem) => {
    setPendingPin(null);
    setSelectedPin(pin);
  }, []);

  const togglePinDone = useCallback(async (pin: FeedbackItem) => {
    const base = feedbackApiBase();
    if (!base) return;
    const nextStatus = pin.status === "done" ? "open" : "done";
    const updated = await patchFeedbackStatus(base, pin.id, nextStatus);
    setPagePins((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedPin((prev) => (prev?.id === updated.id ? updated : prev));
  }, []);

  const value = useMemo<FeedbackContextValue>(
    () => ({
      accessState,
      active,
      beginSignIn,
      needsSignIn,
      toggleActive,
      reviewerEmail,
      reviewerLabel,
      confirmReviewer,
      signInError,
      pagePins,
      pendingPin,
      selectedPin,
      dropPin,
      saveNote,
      closePopover,
      selectPin,
      togglePinDone,
      reloadPins,
    }),
    [
      accessState,
      active,
      beginSignIn,
      needsSignIn,
      toggleActive,
      reviewerEmail,
      reviewerLabel,
      confirmReviewer,
      signInError,
      pagePins,
      pendingPin,
      selectedPin,
      dropPin,
      saveNote,
      closePopover,
      selectPin,
      togglePinDone,
      reloadPins,
    ],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}
