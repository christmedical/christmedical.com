import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmrIcon } from "@/lib/emrIcons";

export const EMR_SURFACE =
  "rounded-xl border border-zinc-200 bg-white shadow-sm";
export const EMR_SURFACE_HEADER =
  "border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-800";
export const EMR_SURFACE_BODY = "p-4";
export const EMR_PAGE_STACK = "space-y-4";

type EmrCardProps = {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

export function EmrCard({ title, icon, children, className = "" }: EmrCardProps) {
  return (
    <section className={`${EMR_SURFACE} ${className}`}>
      <div className={`${EMR_SURFACE_HEADER} flex items-center gap-2`}>
        {icon ? <EmrIcon icon={icon} /> : null}
        {title}
      </div>
      <div className={EMR_SURFACE_BODY}>{children}</div>
    </section>
  );
}
