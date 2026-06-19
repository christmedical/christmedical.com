import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmrIcon } from "@/lib/emrIcons";
import {
  FC_PAGE_STACK,
  FC_SURFACE,
  FC_SURFACE_BODY,
  FC_SURFACE_HEADER,
} from "@/components/design/fieldClinical";

export const EMR_SURFACE = FC_SURFACE;
export const EMR_SURFACE_HEADER = FC_SURFACE_HEADER;
export const EMR_SURFACE_BODY = FC_SURFACE_BODY;
export const EMR_PAGE_STACK = FC_PAGE_STACK;

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
