import type { EmrPageMeta } from "@/lib/emrNav";

type Props = EmrPageMeta & {
  dateLabel?: string;
};

export function EmrPageHeader({ title, badge, badgeClass, dateLabel }: Props) {
  const badgeStyles =
    badgeClass === "amber"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
      : badgeClass === "green"
        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
        : badgeClass === "teal"
          ? "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        {dateLabel ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{dateLabel}</span>
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
