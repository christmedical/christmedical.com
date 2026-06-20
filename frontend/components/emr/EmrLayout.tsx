"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteContext";
import { EmrPageHeader } from "@/components/emr/EmrPageHeader";
import { EmrShell } from "@/components/emr/EmrShell";
import { EMR_PAGE_META } from "@/lib/emrNav";

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EmrLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta =
    EMR_PAGE_META[pathname] ??
    (pathname.startsWith("/patients/")
      ? pathname.endsWith("/new")
        ? { title: "Register patient", badge: "New chart" }
        : { title: "Patient chart", badge: "Active chart" }
      : { title: "Christ Medical" });
  const dateLabel = pathname === "/queue" || pathname === "/dashboard" ? todayLabel() : undefined;

  return (
    <CommandPaletteProvider>
      <EmrShell>
        <EmrPageHeader {...meta} dateLabel={dateLabel} />
        <main className="flex-1 overflow-y-auto bg-fc-paper p-6">{children}</main>
      </EmrShell>
    </CommandPaletteProvider>
  );
}
