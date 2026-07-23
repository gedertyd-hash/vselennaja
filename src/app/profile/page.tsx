import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";

export default async function ProfilePage() {
  const session = await requireSession();

  const [user, completedCount, favoriteCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.userId } }),
    prisma.lessonProgress.count({ where: { userId: session.userId } }),
    prisma.favorite.count({ where: { userId: session.userId } }),
  ]);

  return (
    <main className="flex-1 px-8 py-10 max-w-xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold">Профиль</h1>

      <div className="mt-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-yolk text-yolk-ink flex items-center justify-center text-2xl font-semibold shrink-0">
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-lg">{user.name}</p>
          <p className="text-text-muted text-sm">
            {user.role === "ADMIN" ? "Администратор" : "Участник клуба"}
          </p>
        </div>
      </div>

      <dl className="mt-8 divide-y divide-border-soft rounded-2xl border border-border overflow-hidden">
        {user.email && (
          <div className="flex justify-between px-5 py-3 bg-bg-elevated">
            <dt className="text-text-muted">Email</dt>
            <dd>{user.email}</dd>
          </div>
        )}
        {user.telegramUsername && (
          <div className="flex justify-between px-5 py-3 bg-bg-elevated">
            <dt className="text-text-muted">Telegram</dt>
            <dd>@{user.telegramUsername}</dd>
          </div>
        )}
        <div className="flex justify-between px-5 py-3 bg-bg-elevated">
          <dt className="text-text-muted">Изучено уроков</dt>
          <dd>{completedCount}</dd>
        </div>
        <div className="flex justify-between px-5 py-3 bg-bg-elevated">
          <dt className="text-text-muted">В избранном</dt>
          <dd>{favoriteCount}</dd>
        </div>
        <div className="flex justify-between px-5 py-3 bg-bg-elevated">
          <dt className="text-text-muted">В клубе с</dt>
          <dd>{user.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</dd>
        </div>
      </dl>

      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-yolk text-yolk-ink px-5 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition md:hidden"
        >
          Открыть админку
        </Link>
      )}
    </main>
  );
}
