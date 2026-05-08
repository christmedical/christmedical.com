import { useEffect, useState } from "react";

export function getIsOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  if (typeof navigator.onLine !== "boolean") return true;
  return navigator.onLine;
}

export function subscribeOnlineStatus(
  cb: (online: boolean) => void,
): () => void {
  // SSR / non-browser environments: default to online.
  if (typeof window === "undefined") {
    cb(true);
    return () => {};
  }

  const emit = () => cb(getIsOnline());

  // Provide the latest value immediately.
  emit();

  window.addEventListener("online", emit);
  window.addEventListener("offline", emit);

  return () => {
    window.removeEventListener("online", emit);
    window.removeEventListener("offline", emit);
  };
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(getIsOnline);

  useEffect(() => subscribeOnlineStatus(setOnline), []);

  return online;
}
