import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logoutAction } from "@/app/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <header className="border-b border-black/10 dark:border-white/10 px-6 py-3 flex items-center justify-between">
      <Link href="/courses" className="font-semibold">
        Вселенная
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        <Link href="/courses" className="hover:underline">
          Курсы
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" className="hover:underline">
            Админка
          </Link>
        )}
        <span className="text-black/50 dark:text-white/50">{user.name}</span>
        <form action={logoutAction}>
          <button type="submit" className="hover:underline cursor-pointer">
            Выйти
          </button>
        </form>
      </nav>
    </header>
  );
}
