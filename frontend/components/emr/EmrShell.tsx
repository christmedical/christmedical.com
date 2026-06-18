"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
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

  const sections = ["clinical", "support", "admin"] as const;

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <aside
        className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        aria-label="Clinical workflow"
      >
        <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-lg text-teal-700 dark:text-teal-400" aria-hidden>
              ✝
            </span>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Christ Medical
              </div>
              <div className="text-[10px] text-zinc-500">{branding.shortName} mission</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => (
            <div key={section}>
              <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {SECTION_LABEL[section]}
              </div>
              {EMR_NAV.filter((item) => item.section === section).map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mx-2 flex items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors ${
                      active
                        ? "border-teal-600 bg-teal-50 font-medium text-teal-900 dark:border-teal-500 dark:bg-teal-950/50 dark:text-teal-100"
                        : "border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span className="text-base" aria-hidden>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bronze-deep text-xs font-semibold text-ancient-vellum">
              JM
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                Dr. J. McElveen
              </div>
              <div className="text-[10px] text-zinc-500">Attending physician</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
