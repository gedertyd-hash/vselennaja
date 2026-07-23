import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";
import { IconStar } from "@/components/icons";
import { toggleFavoriteAction } from "@/app/actions/favorites";
import { completeLessonAction, uncompleteLessonAction } from "@/app/actions/progress";
import { MATERIAL_TYPE_META, LEVEL_LABEL, LEVEL_CLASSES } from "@/lib/materials";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireSession();

  const material = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { published: true },
            orderBy: { order: "asc" },
            include: { progress: { where: { userId: session.userId } } },
          },
        },
      },
      favorites: { where: { userId: session.userId } },
    },
  });

  if (!material) notFound();

  const meta = MATERIAL_TYPE_META[material.type];
  const isFavorited = material.favorites.length > 0;

  const favoriteButton = (
    <form action={toggleFavoriteAction.bind(null, material.id)}>
      <button
        type="submit"
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition shrink-0 whitespace-nowrap ${
          isFavorited
            ? "border-yolk text-yolk"
            : "border-border text-cream/75 hover:border-yolk/50 hover:text-yolk"
        }`}
      >
        <IconStar className="w-4 h-4" filled={isFavorited} />
        {isFavorited ? "В избранном" : "В избранное"}
      </button>
    </form>
  );

  const header = (
    <>
      <Link href={meta.href} className="text-sm text-text-muted hover:text-cream transition">
        ← {meta.label}
      </Link>
      <div className="flex items-start justify-between gap-4 mt-2">
        <h1 className="font-display text-3xl font-semibold text-balance">{material.title}</h1>
        {favoriteButton}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${LEVEL_CLASSES[material.level]}`}>
          {LEVEL_LABEL[material.level]}
        </span>
        {material.tag && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-bg-elevated-2 text-cream/70">
            {material.tag}
          </span>
        )}
      </div>
      <p className="text-text-muted mt-4 leading-relaxed">{material.description}</p>
    </>
  );

  if (material.type !== "COURSE") {
    const lesson = material.modules[0]?.lessons[0];
    const done = (lesson?.progress.length ?? 0) > 0;

    return (
      <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
        {header}

        {!lesson ? (
          <p className="text-text-muted mt-10">Материал скоро появится.</p>
        ) : (
          <div className="mt-8">
            {lesson.videoUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border mb-6">
                <iframe
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {lesson.content && (
              <div className="whitespace-pre-wrap leading-relaxed text-cream/90">
                {lesson.content}
              </div>
            )}

            <form
              action={
                done
                  ? uncompleteLessonAction.bind(null, lesson.id, material.slug)
                  : completeLessonAction.bind(null, lesson.id, material.slug)
              }
              className="mt-8"
            >
              <button
                type="submit"
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition ${
                  done
                    ? "border border-border text-cream/75 hover:bg-bg-elevated"
                    : "bg-yolk text-yolk-ink hover:bg-yolk-bright"
                }`}
              >
                {done ? "Изучено ✓ — снять отметку" : "Отметить изученным"}
              </button>
            </form>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
      {header}

      <div className="mt-8 space-y-8">
        {material.modules.map((module) => (
          <section key={module.id}>
            <h2 className="font-medium mb-3">{module.title}</h2>
            <ul className="space-y-2">
              {module.lessons.map((lesson) => {
                const lessonDone = lesson.progress.length > 0;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3 hover:border-yolk/40 transition"
                    >
                      <span
                        className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-xs ${
                          lessonDone
                            ? "bg-yolk text-yolk-ink border-yolk"
                            : "border-border text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="flex-1">{lesson.title}</span>
                    </Link>
                  </li>
                );
              })}
              {module.lessons.length === 0 && (
                <li className="text-sm text-text-faint">Уроки скоро появятся.</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
