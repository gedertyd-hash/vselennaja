import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireSession } from "@/lib/dal";
import { MaterialCard } from "@/components/MaterialCard";
import { MATERIAL_TYPE_META, isNewMaterial } from "@/lib/materials";

export default async function HomePage() {
  const session = await requireSession();
  const user = await getCurrentUser();

  const [recentProgress, latest, favorites] = await Promise.all([
    prisma.lessonProgress.findFirst({
      where: { userId: session.userId },
      orderBy: { completedAt: "desc" },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    }),
    prisma.course.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.favorite.findMany({
      where: { userId: session.userId },
      select: { courseId: true },
    }),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.courseId));

  return (
    <main className="flex-1 px-8 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold">
        Привет, {user?.name?.split(" ")[0] ?? "друг"}
      </h1>

      {recentProgress && (
        <section className="mt-8">
          <p className="text-xs font-semibold tracking-wide text-text-muted uppercase mb-3">
            Продолжить
          </p>
          <Link
            href={`/materials/${recentProgress.lesson.module.course.slug}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-bg-elevated px-5 py-4 hover:border-yolk/40 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-bg-elevated-2 flex items-center justify-center shrink-0">
              {(() => {
                const Icon = MATERIAL_TYPE_META[recentProgress.lesson.module.course.type].icon;
                return <Icon className="w-5 h-5 text-yolk" />;
              })()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-muted uppercase tracking-wide">
                {MATERIAL_TYPE_META[recentProgress.lesson.module.course.type].singular}
              </p>
              <p className="font-medium truncate">{recentProgress.lesson.module.course.title}</p>
            </div>
          </Link>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Новое</p>
          <Link href="/materials" className="text-sm text-yolk hover:text-yolk-bright transition">
            Все материалы →
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="text-text-muted">Материалов пока нет — загляните позже.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.map((item) => (
              <MaterialCard
                key={item.id}
                material={{
                  id: item.id,
                  slug: item.slug,
                  title: item.title,
                  description: item.description,
                  type: item.type,
                  level: item.level,
                  createdAt: item.createdAt,
                  isNew: isNewMaterial(item.createdAt),
                  isFavorited: favoriteIds.has(item.id),
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
