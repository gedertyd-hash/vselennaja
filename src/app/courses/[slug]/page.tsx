import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";

const LESSON_TYPE_LABEL: Record<string, string> = {
  VIDEO: "Видео",
  TEXT: "Текст",
  GUIDE: "Гайд",
  WORKSHOP: "Воркшоп",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireSession();

  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { published: true },
            orderBy: { order: "asc" },
            include: {
              progress: { where: { userId: session.userId } },
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <Link href="/courses" className="text-sm text-black/50 dark:text-white/50 hover:underline">
        ← Все курсы
      </Link>
      <h1 className="text-2xl font-semibold mt-2">{course.title}</h1>
      <p className="text-black/60 dark:text-white/60 mt-1">{course.description}</p>

      <div className="mt-8 space-y-8">
        {course.modules.map((module) => (
          <section key={module.id}>
            <h2 className="font-medium mb-3">{module.title}</h2>
            <ul className="space-y-2">
              {module.lessons.map((lesson) => {
                const done = lesson.progress.length > 0;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/lessons/${lesson.id}`}
                      className="flex items-center gap-3 rounded-lg border border-black/10 dark:border-white/10 px-4 py-3 hover:border-black/30 dark:hover:border-white/30 transition"
                    >
                      <span
                        className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-xs ${
                          done
                            ? "bg-foreground text-background border-foreground"
                            : "border-black/25 dark:border-white/25"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="flex-1">{lesson.title}</span>
                      <span className="text-xs text-black/40 dark:text-white/40">
                        {LESSON_TYPE_LABEL[lesson.type]}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {module.lessons.length === 0 && (
                <li className="text-sm text-black/40 dark:text-white/40">
                  Уроки скоро появятся.
                </li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
