export type EmrNavItem = {
  href: string;
  label: string;
  icon: string;
  section: "clinical" | "support" | "admin";
};

export const EMR_NAV: EmrNavItem[] = [
  { href: "/queue", label: "Patient queue", icon: "👥", section: "clinical" },
  { href: "/check-in", label: "Check-in", icon: "➕", section: "clinical" },
  { href: "/encounter", label: "Encounter", icon: "📋", section: "clinical" },
  { href: "/history", label: "Patient history", icon: "🕐", section: "clinical" },
  { href: "/medications", label: "Medications", icon: "💊", section: "support" },
  { href: "/labs", label: "Labs & orders", icon: "🔬", section: "support" },
  { href: "/spiritual", label: "Spiritual care", icon: "🤍", section: "support" },
  { href: "/discharge", label: "Discharge", icon: "🚪", section: "support" },
  { href: "/dashboard", label: "Dashboard", icon: "📊", section: "admin" },
];

export type EmrPageMeta = {
  title: string;
  badge?: string;
  badgeClass?: string;
};

export const EMR_PAGE_META: Record<string, EmrPageMeta> = {
  "/queue": { title: "Patient queue", badge: "Today" },
  "/check-in": { title: "Check-in & triage", badge: "New patient" },
  "/encounter": { title: "Encounter", badge: "In encounter", badgeClass: "amber" },
  "/history": { title: "Patient history", badge: "Active chart" },
  "/medications": { title: "Medications & Rx", badge: "Active chart" },
  "/labs": { title: "Labs & orders", badge: "Active chart" },
  "/spiritual": { title: "Spiritual care", badge: "Active chart", badgeClass: "teal" },
  "/discharge": { title: "Discharge", badge: "Ready to discharge", badgeClass: "green" },
  "/dashboard": { title: "Mission dashboard", badge: "Live" },
  "/search": { title: "Patient search", badge: "Find patient" },
  "/patients": { title: "Patient list", badge: "Offline-capable" },
};
