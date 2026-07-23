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

type SidebarUser = {
  name: string;
  role: string;
  telegramUsername: string | null;
};

const NAV_ITEMS = [
  { href: "/home", label: "Главная", icon: IconHome },
  { href: "/start", label: "Старт", icon: IconRocket },
  { href: "/materials", label: "Материалы", icon: IconGrid },
  { href: "/favorites", label: "Избранное", icon: IconStar },
  { href: "/profile", label: "Профиль", icon: IconUser },
];

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-bg-elevated/40 flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-6 py-6 flex items-center gap-2.5">
        <YolkMark className="w-6 h-6" />
        <span className="font-display font-semibold text-lg tracking-tight">
          ИИшница
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-yolk text-yolk-ink"
                  : "text-cream/75 hover:bg-bg-elevated-2 hover:text-cream"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/admin")
                ? "bg-yolk text-yolk-ink"
                : "text-cream/75 hover:bg-bg-elevated-2 hover:text-cream"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
              <path d="M12 3.5 20 7v5c0 5-3.4 8-8 9.5-4.6-1.5-8-4.5-8-9.5V7l8-3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Админка
          </Link>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-border-soft pt-4 mx-3">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-yolk text-yolk-ink flex items-center justify-center text-sm font-semibold shrink-0">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-sage">В клубе</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Выйти"
              className="text-text-muted hover:text-cream transition p-1"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
                <path d="M15 8V6.5A1.5 1.5 0 0 0 13.5 5h-7A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19h7a1.5 1.5 0 0 0 1.5-1.5V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 12h9.5m0 0-2.5-2.5m2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
