"use client";

import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/lib/onlineStatus";

export function ConnectivityBanner() {
  const online = useOnlineStatus();
  const prevOnline = useRef<boolean>(online);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (online) {
      if (prevOnline.current === false) {
        setShowBackOnline(true);
        hideTimer.current = setTimeout(() => {
          setShowBackOnline(false);
        }, 3000);
      } else {
        setShowBackOnline(false);
      }
    } else {
      setShowBackOnline(false);
    }

    prevOnline.current = online;

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [online]);

  if (!online) {
    return (
      <div className="fixed inset-x-0 top-0 z-[90] border-b border-red-700/30 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm">
        <div className="mx-auto max-w-6xl">
          Connection lost — you can keep working, but saving is paused.
        </div>
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div className="fixed inset-x-0 top-0 z-[90] border-b border-emerald-700/30 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm">
        <div className="mx-auto max-w-6xl">Back online — saving is available.</div>
      </div>
    );
  }

  return null;
}

