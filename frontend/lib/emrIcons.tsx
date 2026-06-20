import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FlaskConical,
  Heart,
  History,
  LogOut,
  Pill,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

export const EMR_ICON_SIZE = 18;
export const EMR_ICON_STROKE = 1.75;

export function EmrIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Icon
      size={EMR_ICON_SIZE}
      strokeWidth={EMR_ICON_STROKE}
      className="shrink-0 text-current"
      aria-hidden
    />
  );
}

export const EMR_NAV_ICONS = {
  queue: Users,
  checkIn: UserPlus,
  encounter: ClipboardList,
  history: History,
  medications: Pill,
  labs: FlaskConical,
  spiritual: Heart,
  discharge: LogOut,
  dashboard: BarChart3,
  patients: Search,
  settings: Settings,
} as const satisfies Record<string, LucideIcon>;
