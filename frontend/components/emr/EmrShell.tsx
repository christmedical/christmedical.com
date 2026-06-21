"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, RefObject } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ChristMedicalLogo } from "@/components/ChristMedicalLogo";
import { useCommandPalette } from "@/components/command-palette/CommandPaletteContext";
import { FC_NAV_ACTIVE, FC_NAV_IDLE, FC_SECTION_LABEL } from "@/components/design/fieldClinical";
import { EmrIcon } from "@/lib/emrIcons";
import { EMR_NAV } from "@/lib/emrNav";
import { getTenantBranding } from "@/lib/tenantConfig";
import { getTenantId } from "@/lib/tenantRuntime";
import { useNavRailCollapse } from "@/lib/useNavRailCollapse";

const SECTION_LABEL: Record<string, string> = {
  clinical: "Clinical",
  support: "Support",
  admin: "Admin",
};

function isActivePath(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/patients" && pathname.startsWith("/patients"))
  );
}

function MobileWorkflowBar({
  pathname,
  isOpen,
  openPalette,
  searchTriggerRef,
}: {
  pathname: string;
  isOpen: boolean;
  openPalette: () => void;
  searchTriggerRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-fc-border bg-fc-surface/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden"
      aria-label="Mobile workflow"
    >
      <div className="flex items-stretch gap-2 overflow-x-auto">
        <button
          ref={searchTriggerRef}
          type="button"
          onClick={openPalette}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Search patients"
          className="flex min-h-14 min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-xl border border-fc-border-strong bg-fc-paper px-3 text-xs font-medium text-fc-ink transition-colors hover:border-fc-accent/40 hover:bg-fc-accent-tint focus:border-fc-accent focus:outline-none focus:ring-2 focus:ring-fc-accent/20"
        >
          <Search className="h-4 w-4 shrink-0 text-fc-accent" aria-hidden />
          <span>Search</span>
        </button>
        {EMR_NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-xl px-3 text-xs transition-colors ${
                active ? FC_NAV_ACTIVE : FC_NAV_IDLE
              }`}
            >
              <EmrIcon icon={item.icon} />
              <span className="max-w-16 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function EmrShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tenantId = getTenantId();
  const branding = getTenantBranding(tenantId);
  const { isOpen, openPalette, searchTriggerRef } = useCommandPalette();
  const { collapsed, mobile, toggleManual } = useNavRailCollapse();

  const sections = ["clinical", "support", "admin"] as const;

  if (mobile) {
    return (
      <div className="flex min-h-screen bg-fc-paper text-fc-ink">
        <div className="flex min-w-0 flex-1 flex-col pb-24">{children}</div>
        <MobileWorkflowBar
          pathname={pathname}
          isOpen={isOpen}
          openPalette={openPalette}
          searchTriggerRef={searchTriggerRef}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-fc-paper text-fc-ink">
      <aside
        className={`flex shrink-0 flex-col border-r border-fc-border bg-fc-surface transition-[width] duration-200 ${
          collapsed ? "w-[4.5rem]" : "w-60"
        }`}
        aria-label="Clinical workflow"
      >
        <div
          className={`border-b border-fc-border ${collapsed ? "flex justify-center px-2 py-3" : "px-4 py-4"}`}
        >
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <ChristMedicalLogo
              size={44}
              className="h-11 w-11 shrink-0 rounded-lg bg-fc-paper shadow-sm ring-1 ring-fc-border/60"
              priority
            />
            {!collapsed ? (
              <div className="min-w-0 font-display text-sm font-semibold tracking-tight text-fc-ink">
                {branding.shortName}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`py-2 ${collapsed ? "flex justify-center px-2" : "px-2"}`}>
          <button
            ref={searchTriggerRef}
            type="button"
            onClick={openPalette}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label="Search patients"
            title={collapsed ? "Search patients" : undefined}
            className={`flex min-h-11 items-center rounded-lg border border-fc-border-strong bg-fc-paper text-sm font-medium text-fc-ink transition-colors hover:border-fc-accent/40 hover:bg-fc-accent-tint focus:border-fc-accent focus:outline-none focus:ring-2 focus:ring-fc-accent/20 ${
              collapsed
                ? "h-11 w-11 shrink-0 justify-center p-0"
                : "w-full gap-2.5 px-3 py-2"
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-fc-accent" aria-hidden />
            {!collapsed ? (
              <>
                Search patients
                <kbd className="ml-auto hidden rounded border border-fc-border bg-fc-surface px-1.5 py-0.5 font-mono text-[10px] text-fc-ink-subtle sm:inline">
                  ⌘Space
                </kbd>
              </>
            ) : null}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section}>
              {!collapsed ? (
                <div className={`px-4 py-2 ${FC_SECTION_LABEL}`}>{SECTION_LABEL[section]}</div>
              ) : null}
              {EMR_NAV.filter((item) => item.section === section).map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={collapsed ? item.label : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`flex min-h-11 items-center rounded-lg text-sm transition-colors ${
                      collapsed
                        ? `mx-2 justify-center px-0 ${active ? FC_NAV_ACTIVE : FC_NAV_IDLE}`
                        : `mx-2 gap-2.5 px-3 py-2 ${active ? FC_NAV_ACTIVE : FC_NAV_IDLE}`
                    }`}
                  >
                    <EmrIcon icon={item.icon} />
                    {!collapsed ? item.label : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`border-t border-fc-border p-2 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={toggleManual}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className={`flex min-h-11 items-center rounded-lg text-fc-ink-muted transition-colors hover:bg-fc-accent-tint hover:text-fc-ink ${
              collapsed ? "h-11 w-11 justify-center" : "w-full gap-2 px-3"
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
