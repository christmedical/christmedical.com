"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChristMedicalLogo } from "@/components/ChristMedicalLogo";
import { FC_BTN_PRIMARY } from "@/components/design/fieldClinical";
import { loginOrigin } from "@/lib/subdomain";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
] as const;

function navClass(active: boolean): string {
  return active
    ? "font-medium text-fc-ink"
    : "text-fc-ink-muted transition-colors hover:text-fc-ink";
}

/** Shared chrome for christmedical.com / www product pages. */
export function MarketingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const signInHref = loginOrigin(
    typeof window !== "undefined" ? window.location.host : undefined,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-fc-paper text-fc-ink">
      <header className="border-b border-fc-border bg-fc-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <ChristMedicalLogo
              size={44}
              className="rounded-lg ring-1 ring-fc-border/60"
              priority
            />
            <span className="font-display text-sm font-semibold tracking-tight text-fc-ink">
              Christ Medical
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm sm:flex" aria-label="Product">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={navClass(pathname === href)}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <a href={signInHref} className={`${FC_BTN_PRIMARY} shrink-0 px-5`}>
            Sign in
          </a>
        </div>
        <nav
          className="flex gap-6 border-t border-fc-border px-6 py-2 text-sm sm:hidden"
          aria-label="Product mobile"
        >
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={navClass(pathname === href)}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-fc-border bg-fc-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-fc-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Christ Medical</p>
          <div className="flex flex-wrap gap-6">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-fc-ink">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
