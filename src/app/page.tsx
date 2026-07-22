import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Вселенная
        </h1>
        <p className="text-base text-black/70 dark:text-white/70">
          Уроки, гайды и воркшопы закрытого клуба — в одном месте, с прогрессом
          и доступом прямо из Telegram.
        </p>
      </div>

      <div className="flex gap-3">
        {user ? (
          <Link
            href="/courses"
            className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            К урокам
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-black/15 dark:border-white/20 px-6 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Зарегистрироваться
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
