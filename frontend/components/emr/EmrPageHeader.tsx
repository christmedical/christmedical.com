import type { EmrPageMeta } from "@/lib/emrNav";

type Props = EmrPageMeta & {
  dateLabel?: string;
};

export function EmrPageHeader({ title, badge, badgeClass, dateLabel }: Props) {
  const badgeStyles =
    badgeClass === "amber" || badgeClass === "hope"
      ? "bg-fc-status-hope-bg text-fc-status-hope-ink"
      : badgeClass === "green"
        ? "bg-fc-status-heard-bg text-fc-status-heard-ink"
        : badgeClass === "accent"
          ? "bg-fc-accent-tint text-fc-ink"
          : "bg-fc-status-none-bg text-fc-status-none-ink";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-fc-border bg-fc-surface px-6 py-4">
      <h1 className="font-display text-lg font-semibold tracking-tight text-fc-ink">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {dateLabel ? (
          <span className="font-tabular text-xs text-fc-ink-subtle">{dateLabel}</span>
        ) : null}
        {badge ? (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles}`}>
            {badge}
          </span>
        ) : null}
      </div>
    </header>
  );
}
