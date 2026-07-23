import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { YolkMark } from "@/components/icons";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-20 text-center relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full opacity-20 blur-[120px]"
        style={{ background: "var(--yolk)" }}
      />

      <YolkMark className="w-28 h-28 sm:w-32 sm:h-32 relative" />

      <div className="max-w-2xl space-y-5 relative">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
          Разберись в ИИ, пока другие ещё гуглят промпты
        </h1>
        <p className="text-base text-cream/70 leading-relaxed max-w-md mx-auto">
          Закрытый клуб «ИИшница» — гайды, курсы, юзкейсы и воркшопы по
          Claude, ChatGPT и ИИ-агентам. Заходишь из Telegram, учишься в
          удобном темпе, применяешь сразу.
        </p>
      </div>

      <div className="flex gap-3 relative">
        <Link
          href="/login"
          className="rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition"
        >
          Войти
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-cream hover:bg-bg-elevated transition"
        >
          Зарегистрироваться
        </Link>
      </div>
    </main>
  );
}
