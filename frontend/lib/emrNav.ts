import type { LucideIcon } from "lucide-react";
import { EMR_NAV_ICONS } from "@/lib/emrIcons";

export type EmrNavSection = "clinical" | "support" | "admin";

export type EmrNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: EmrNavSection;
};

export const EMR_NAV: EmrNavItem[] = [
  { href: "/queue", label: "Patient queue", icon: EMR_NAV_ICONS.queue, section: "clinical" },
  { href: "/patients", label: "Patients", icon: EMR_NAV_ICONS.patients, section: "clinical" },
  { href: "/check-in", label: "Check-in", icon: EMR_NAV_ICONS.checkIn, section: "clinical" },
  { href: "/encounter", label: "Encounter", icon: EMR_NAV_ICONS.encounter, section: "clinical" },
  { href: "/history", label: "Patient history", icon: EMR_NAV_ICONS.history, section: "clinical" },
  { href: "/medications", label: "Medications", icon: EMR_NAV_ICONS.medications, section: "support" },
  { href: "/labs", label: "Labs & orders", icon: EMR_NAV_ICONS.labs, section: "support" },
  { href: "/spiritual", label: "Spiritual care", icon: EMR_NAV_ICONS.spiritual, section: "support" },
  { href: "/discharge", label: "Discharge", icon: EMR_NAV_ICONS.discharge, section: "support" },
  { href: "/dashboard", label: "Dashboard", icon: EMR_NAV_ICONS.dashboard, section: "admin" },
];

export type EmrPageMeta = {
  title: string;
  badge?: string;
  badgeClass?: string;
};

export const EMR_PAGE_META: Record<string, EmrPageMeta> = {
  "/queue": { title: "Patient queue", badge: "Today" },
  "/patients": { title: "Patients", badge: "Search & charts" },
  "/check-in": { title: "Check-in & triage", badge: "New patient" },
  "/encounter": { title: "Encounter", badge: "In encounter", badgeClass: "amber" },
  "/history": { title: "Patient history", badge: "Active chart" },
  "/medications": { title: "Medications & Rx", badge: "Active chart" },
  "/labs": { title: "Labs & orders", badge: "Active chart" },
  "/spiritual": { title: "Spiritual care", badge: "Active chart", badgeClass: "teal" },
  "/discharge": { title: "Discharge", badge: "Ready to discharge", badgeClass: "green" },
  "/dashboard": { title: "Mission dashboard", badge: "Live" },
};
