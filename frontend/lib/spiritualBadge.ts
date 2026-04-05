/** Tailwind classes for spiritual-status chips (used by patient list and unit tests). */
export function spiritualStatusBadgeClass(
  kind: "heard" | "hope" | "none",
): string {
  switch (kind) {
    case "heard":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800";
    case "hope":
      return "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-800";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700";
  }
}
