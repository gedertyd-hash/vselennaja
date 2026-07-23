"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  YolkMark,
  IconHome,
  IconRocket,
  IconGrid,
  IconStar,
  IconUser,
} from "@/components/icons";

type MobileUser = {
  name: string;
};

const NAV_ITEMS = [
  { href: "/home", label: "Главная", icon: IconHome },
  { href: "/start", label: "Старт", icon: IconRocket },
  { href: "/materials", label: "Материалы", icon: IconGrid },
  { href: "/favorites", label: "Избранное", icon: IconStar },
  { href: "/profile", label: "Профиль", icon: IconUser },
];

export function MobileNav({ user }: { user: MobileUser }) {
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-border bg-bg/95 backdrop-blur">
        <Link href="/home" className="flex items-center gap-2">
          <YolkMark className="w-5 h-5" />
          <span className="font-display font-semibold tracking-tight">ИИшница</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-yolk text-yolk-ink flex items-center justify-center text-xs font-semibold shrink-0">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <form action={logoutAction}>
            <button type="submit" aria-label="Выйти" className="text-text-muted hover:text-cream transition p-1">
              <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
                <path d="M15 8V6.5A1.5 1.5 0 0 0 13.5 5h-7A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19h7a1.5 1.5 0 0 0 1.5-1.5V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 12h9.5m0 0-2.5-2.5m2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex items-stretch justify-around border-t border-border bg-bg-elevated/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                active ? "text-yolk" : "text-text-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
