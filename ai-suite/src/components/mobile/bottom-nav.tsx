"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, History, Home, LayoutGrid, User } from "lucide-react";

import { useI18n } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", hash: "", icon: Home, labelKey: "mobileNav.home" as const, match: (p: string) => p === "/" },
  {
    href: "/",
    hash: "#home-tools",
    icon: LayoutGrid,
    labelKey: "mobileNav.tools" as const,
    match: (p: string) => p === "/" || p.startsWith("/tool/") || p.startsWith("/tools/"),
  },
  {
    href: "/history",
    hash: "",
    icon: History,
    labelKey: "nav.history" as const,
    match: (p: string) => p === "/history" || p.startsWith("/request/"),
  },
  {
    href: "/pricing",
    hash: "",
    icon: Coins,
    labelKey: "mobileNav.credits" as const,
    match: (p: string) => p === "/pricing" || p === "/free-credits",
  },
  {
    href: "/account",
    hash: "",
    icon: User,
    labelKey: "nav.account" as const,
    match: (p: string) => p === "/account" || p.startsWith("/account/") || p === "/login",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("mobileNav.ariaLabel")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] border-t border-slate-300/70 bg-white/92 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(30,27,75,0.08)]",
        "lg:hidden"
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 pt-1">
        {items.map(({ href, hash, icon: Icon, labelKey, match }) => {
          const active = match(pathname);
          const to = `${href}${hash}`;
          return (
            <li key={to} className="min-w-0 flex-1">
              <Link
                href={to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold leading-none transition-colors",
                  active
                    ? "text-violet-800 bg-violet-100/80"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                <span className="max-w-full truncate">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
