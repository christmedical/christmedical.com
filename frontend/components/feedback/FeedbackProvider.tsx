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
  patchFeedbackStatus,
  type FeedbackItem,
} from "@/lib/feedbackApi";

type PendingPin = { pinX: number; pinY: number };

type FeedbackContextValue = {
  active: boolean;
  toggleActive: () => void;
  reviewerLabel: string;
  setReviewerLabel: (label: string) => void;
  needsLabel: boolean;
  confirmLabel: (label: string) => void;
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
  const [active, setActive] = useState(false);
  const [reviewerLabel, setReviewerLabelState] = useState("");
  const [labelConfirmed, setLabelConfirmed] = useState(false);
  const [pagePins, setPagePins] = useState<FeedbackItem[]>([]);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [selectedPin, setSelectedPin] = useState<FeedbackItem | null>(null);

  const needsLabel = active && !labelConfirmed;

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
    if (active) void reloadPins();
  }, [active, pathname, reloadPins]);

  const toggleActive = useCallback(() => {
    setActive((prev) => {
      const next = !prev;
      if (!next) {
        setPendingPin(null);
        setSelectedPin(null);
      }
      return next;
    });
  }, []);

  const confirmLabel = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setReviewerLabelState(trimmed);
    setLabelConfirmed(true);
  }, []);

  const dropPin = useCallback((pinX: number, pinY: number) => {
    if (!labelConfirmed) return;
    setSelectedPin(null);
    setPendingPin({ pinX, pinY });
  }, [labelConfirmed]);

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
        reviewerLabel: reviewerLabel || "Reviewer",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
      });

      setPagePins((prev) => [...prev, created]);
      setPendingPin(null);
    },
    [pathname, pendingPin, reviewerLabel],
  );

  const selectPin = useCallback((pin: FeedbackItem) => {
    setPendingPin(null);
    setSelectedPin(pin);
  }, []);

  const togglePinDone = useCallback(
    async (pin: FeedbackItem) => {
      const base = feedbackApiBase();
      if (!base) return;
      const nextStatus = pin.status === "done" ? "open" : "done";
      const updated = await patchFeedbackStatus(base, pin.id, nextStatus);
      setPagePins((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPin((prev) => (prev?.id === updated.id ? updated : prev));
    },
    [],
  );

  const value = useMemo<FeedbackContextValue>(
    () => ({
      active,
      toggleActive,
      reviewerLabel,
      setReviewerLabel: setReviewerLabelState,
      needsLabel,
      confirmLabel,
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
      active,
      toggleActive,
      reviewerLabel,
      needsLabel,
      confirmLabel,
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
