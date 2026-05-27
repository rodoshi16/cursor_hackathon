"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones, LayoutDashboard, ScrollText } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/reports", label: "Prep Report", Icon: ScrollText },
  { href: "/agent", label: "Voice Agent", Icon: Headphones },
] as const;

export function AppNav() {
  const pathname = usePathname() || "";
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <nav className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2"
            title="Back to landing"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-zinc-900 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              InterviewRadar
            </span>
          </Link>
          {demoMode && (
            <span className="chip border-zinc-200 bg-zinc-50 text-zinc-600">
              <span className="dot bg-amber-500" />
              Demo Mode
            </span>
          )}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          {TABS.map(({ href, label, Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : href === "/agent"
                ? pathname === "/agent"
                : pathname.startsWith("/reports");
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          {TABS.map(({ href, label, Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : href === "/agent"
                ? pathname === "/agent"
                : pathname.startsWith("/reports");
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`grid h-9 w-9 place-items-center rounded-md ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
