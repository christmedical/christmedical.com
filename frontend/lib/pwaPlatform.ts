/** iPhone / iPad / iPod, including iPadOS 13+ desktop UA. */
export function isIosOrIpados(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  const nav = navigator as Navigator & { maxTouchPoints?: number };
  return navigator.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1;
}

/** True when running as installed PWA (standalone / full-screen). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia("(display-mode: standalone)");
  if (mm.matches) return true;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return iosStandalone === true;
}
