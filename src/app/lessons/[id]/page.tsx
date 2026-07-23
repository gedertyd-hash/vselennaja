import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";
import { completeLessonAction, uncompleteLessonAction } from "@/app/actions/progress";
import { MarkdownContent } from "@/components/MarkdownContent";

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

  return (
    <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
      <Link
        href={`/materials/${courseSlug}`}
        className="text-sm text-text-muted hover:text-cream transition"
      >
        ← {lesson.module.course.title}
      </Link>

      <h1 className="font-display text-2xl font-semibold mt-2">{lesson.title}</h1>

      {lesson.videoUrl && (
        <div className="mt-6 aspect-video rounded-2xl overflow-hidden border border-border">
          <iframe
            src={lesson.videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
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

      <div className="mt-10 flex justify-between text-sm text-cream/80">
        {prev ? (
          <Link href={`/lessons/${prev.id}`} className="hover:text-yolk transition">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/lessons/${next.id}`} className="hover:text-yolk transition">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
