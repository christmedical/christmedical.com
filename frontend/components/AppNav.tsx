"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Patient search" },
  { href: "/patients", label: "Patient list" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3"
        aria-label="Main"
      >
        <span className="mr-4 text-sm font-semibold tracking-tight text-teal-700 dark:text-teal-400">
          Christ Medical
        </span>
        {links.map(({ href, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
