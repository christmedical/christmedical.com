"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Search, Stethoscope } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette/CommandPaletteContext";
import { FC_NAV_ACTIVE, FC_NAV_IDLE, FC_SECTION_LABEL } from "@/components/design/fieldClinical";
import { EmrIcon } from "@/lib/emrIcons";
import { EMR_NAV } from "@/lib/emrNav";
import { getTenantBranding } from "@/lib/tenantConfig";
import { getTenantId } from "@/lib/tenantRuntime";

const SECTION_LABEL: Record<string, string> = {
  clinical: "Clinical",
  support: "Support",
  admin: "Admin",
};

export function EmrShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tenantId = getTenantId();
  const branding = getTenantBranding(tenantId);
  const { isOpen, openPalette, searchTriggerRef } = useCommandPalette();

  const sections = ["clinical", "support", "admin"] as const;

  return (
    <div className="flex min-h-screen bg-fc-paper text-fc-ink">
      <aside
        className="flex w-60 shrink-0 flex-col border-r border-fc-border bg-fc-surface"
        aria-label="Clinical workflow"
      >
        <div className="border-b border-fc-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fc-accent text-fc-paper shadow-sm"
              aria-hidden
            >
              <Stethoscope className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold tracking-tight text-fc-ink">
                Christ Medical
              </div>
              <div className="text-[10px] text-fc-ink-subtle">{branding.shortName} mission</div>
            </div>
          </div>
        </div>

        <div className="px-2 py-2">
          <button
            ref={searchTriggerRef}
            type="button"
            onClick={openPalette}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label="Search patients"
            className="flex min-h-11 w-full items-center gap-2.5 rounded-lg border border-fc-border-strong bg-fc-paper px-3 py-2 text-sm font-medium text-fc-ink transition-colors hover:border-fc-accent/40 hover:bg-fc-accent-tint focus:border-fc-accent focus:outline-none focus:ring-2 focus:ring-fc-accent/20"
          >
            <Search className="h-4 w-4 shrink-0 text-fc-accent" aria-hidden />
            Search patients
            <kbd className="ml-auto hidden rounded border border-fc-border bg-fc-surface px-1.5 py-0.5 font-mono text-[10px] text-fc-ink-subtle sm:inline">
              ⌘Space
            </kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section}>
              <div className={`px-4 py-2 ${FC_SECTION_LABEL}`}>
                {SECTION_LABEL[section]}
              </div>
              {EMR_NAV.filter((item) => item.section === section).map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`) ||
                  (item.href === "/patients" && pathname.startsWith("/patients"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mx-2 flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active ? FC_NAV_ACTIVE : FC_NAV_IDLE
                    }`}
                  >
                    <EmrIcon icon={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
