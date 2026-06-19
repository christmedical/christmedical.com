/** Tailwind classes for spiritual-status pills (Field Clinical tokens). */
export function spiritualStatusBadgeClass(
  kind: "heard" | "hope" | "none",
): string {
  switch (kind) {
    case "heard":
      return "bg-fc-status-heard-bg text-fc-status-heard-ink ring-1 ring-inset ring-fc-status-heard-ring";
    case "hope":
      return "bg-fc-status-hope-bg text-fc-status-hope-ink ring-1 ring-inset ring-fc-status-hope-ring";
    default:
      return "bg-fc-status-none-bg text-fc-status-none-ink ring-1 ring-inset ring-fc-status-none-ring";
  }
}
