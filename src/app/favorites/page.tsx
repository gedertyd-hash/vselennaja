import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";
import { MaterialCard } from "@/components/MaterialCard";
import { isNewMaterial } from "@/lib/materials";

export default async function FavoritesPage() {
  const session = await requireSession();

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { course: true },
  });

  return (
    <main className="flex-1 px-8 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold">Избранное</h1>
      <p className="text-text-muted mt-2">Материалы, которые вы отметили звёздочкой.</p>

      {favorites.length === 0 ? (
        <p className="text-text-muted mt-10">
          Пока пусто.{" "}
          <Link href="/materials" className="text-yolk hover:text-yolk-bright transition">
            Загляните в материалы
          </Link>{" "}
          и добавьте что-нибудь полезное.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {favorites.map(({ course }) => (
            <MaterialCard
              key={course.id}
              material={{
                id: course.id,
                slug: course.slug,
                title: course.title,
                description: course.description,
                type: course.type,
                level: course.level,
                createdAt: course.createdAt,
                isNew: isNewMaterial(course.createdAt),
                isFavorited: true,
                coverImage: course.coverImage,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
