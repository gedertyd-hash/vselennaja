import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";
import { completeLessonAction, uncompleteLessonAction } from "@/app/actions/progress";
import { MarkdownContent } from "@/components/MarkdownContent";
import { LESSON_KIND_LABEL } from "@/lib/materials";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const lesson = await prisma.lesson.findFirst({
    where: { id, published: true },
    include: {
      module: { include: { course: true } },
      progress: { where: { userId: session.userId } },
    },
  });

  if (!lesson) notFound();

  const courseSlug = lesson.module.course.slug;

  const siblings = await prisma.lesson.findMany({
    where: { published: true, module: { courseId: lesson.module.courseId } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true, title: true },
  });
  const index = siblings.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const done = lesson.progress.length > 0;

  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId: session.userId,
      lesson: { published: true, module: { courseId: lesson.module.courseId } },
    },
  });
  const progressPercent =
    siblings.length > 0 ? Math.round((completedCount / siblings.length) * 100) : 0;

  return (
    <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
      <Link
        href={`/materials/${courseSlug}`}
        className="text-sm text-text-muted hover:text-cream transition"
      >
        ← {lesson.module.course.title}
      </Link>

      <h1 className="font-display text-2xl font-semibold mt-2">{lesson.title}</h1>

      {(lesson.kind || lesson.durationMinutes) && (
        <p className="text-xs text-text-muted mt-1.5">
          {lesson.kind ? (
            <span className={lesson.kind === "PRACTICE" ? "text-yolk-bright font-semibold" : undefined}>
              {LESSON_KIND_LABEL[lesson.kind]}
            </span>
          ) : null}
          {lesson.kind && lesson.durationMinutes ? " · " : null}
          {lesson.durationMinutes ? `${lesson.durationMinutes} мин` : null}
        </p>
      )}

      {siblings.length > 1 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-text-muted">
              Урок {index + 1} из {siblings.length}
            </span>
            <span className="text-text-muted">{progressPercent}% курса пройдено</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-elevated-2 overflow-hidden">
            <div
              className="h-full bg-yolk rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {lesson.videoUrl && (
        <div className="mt-6 aspect-video rounded-2xl overflow-hidden border border-border">
          {/\.(mp4|webm|ogg)$/.test(lesson.videoUrl) ? (
            <video src={lesson.videoUrl} controls className="w-full h-full bg-black" />
          ) : (
            <iframe
              src={lesson.videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      )}

      {lesson.content && (
        <div className="mt-6">
          <MarkdownContent content={lesson.content} />
        </div>
      )}

      <div className="mt-8">
        <form
          action={
            done
              ? uncompleteLessonAction.bind(null, lesson.id, courseSlug)
              : completeLessonAction.bind(null, lesson.id, courseSlug)
          }
        >
          <button
            type="submit"
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition ${
              done
                ? "border border-border text-cream/75 hover:bg-bg-elevated"
                : "bg-yolk text-yolk-ink hover:bg-yolk-bright"
            }`}
          >
            {done ? "Пройден ✓ — снять отметку" : "Отметить как пройденный"}
          </button>
        </form>
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        {prev ? (
          <Link
            href={`/lessons/${prev.id}`}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-cream/80 hover:bg-bg-elevated transition shrink-0"
          >
            ← Предыдущий урок
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/lessons/${next.id}`}
            className="rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition shrink-0"
          >
            Следующий урок →
          </Link>
        ) : (
          <Link
            href={`/materials/${courseSlug}`}
            className="rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition shrink-0"
          >
            Курс пройден — к обзору →
          </Link>
        )}
      </div>
    </main>
  );
}
