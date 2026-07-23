import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";
import { MaterialCard } from "@/components/MaterialCard";
import { MATERIAL_TYPE_META, pluralizeCount, isNewMaterial } from "@/lib/materials";

export async function MaterialTypeListing({
  type,
  activeTag,
}: {
  type: "GUIDE" | "COURSE" | "CASE" | "WORKSHOP";
  activeTag?: string;
}) {
  const session = await requireSession();
  const meta = MATERIAL_TYPE_META[type];

  const [allOfType, favorites] = await Promise.all([
    prisma.course.findMany({
      where: { type, published: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: session.userId },
      select: { courseId: true },
    }),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.courseId));
  const tags = Array.from(new Set(allOfType.map((c) => c.tag).filter((t): t is string => !!t)));

  const items = activeTag ? allOfType.filter((c) => c.tag === activeTag) : allOfType;

  return (
    <main className="flex-1 px-8 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold">
        {meta.label} <span className="text-text-faint font-sans text-2xl">{allOfType.length}</span>
      </h1>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          <Link
            href={meta.href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !activeTag
                ? "bg-yolk text-yolk-ink"
                : "bg-bg-elevated text-cream/75 hover:bg-bg-elevated-2"
            }`}
          >
            Все
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`${meta.href}?tag=${encodeURIComponent(tag)}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeTag === tag
                  ? "bg-yolk text-yolk-ink"
                  : "bg-bg-elevated text-cream/75 hover:bg-bg-elevated-2"
              }`}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-text-muted mt-10">
          Пока пусто. Загляните позже — {pluralizeCount(0, meta.singular)} скоро появятся.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {items.map((item) => (
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
    </main>
  );
}
