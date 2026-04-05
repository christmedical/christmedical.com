"use client";

import { useEffect, useState } from "react";
import { isIosOrIpados, isStandaloneDisplayMode } from "@/lib/pwaPlatform";

const DISMISS_KEY = "cm-pwa-install-dismissed";

/**
 * iOS/iPadOS-only nudge for “Add to Home Screen”. Suppresses in standalone
 * and when the user checks “Don’t show again”.
 */
export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isIosOrIpados() || isStandaloneDisplayMode()) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    setOpen(true);
  }, []);

  const close = (persist: boolean) => {
    if (persist) {
      try {
        window.localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white/95 p-5 shadow-2xl backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
        <h2
          id="pwa-install-title"
          className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Clinical mode on your home screen
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          To use ChristMedical in clinical mode, tap the &quot;Share&quot; icon
          and select &quot;Add to Home Screen&quot;.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="size-4 rounded border-zinc-400 text-teal-600 focus:ring-teal-500"
          />
          Don&apos;t show this again
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => close(dontShowAgain)}
            className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-medium text-white shadow hover:bg-teal-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
