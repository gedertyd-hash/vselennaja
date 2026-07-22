import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import {
  createLessonAction,
  createModuleAction,
  toggleCoursePublishedAction,
  toggleLessonPublishedAction,
} from "@/app/actions/courses";

const LESSON_TYPES = [
  { value: "TEXT", label: "Текст" },
  { value: "VIDEO", label: "Видео" },
  { value: "GUIDE", label: "Гайд" },
  { value: "WORKSHOP", label: "Воркшоп" },
];

export default async function AdminCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) notFound();

  return (
    <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
      <Link href="/admin" className="text-sm text-black/50 dark:text-white/50 hover:underline">
        ← Все курсы
      </Link>

      <div className="flex items-center justify-between mt-2">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <form action={toggleCoursePublishedAction.bind(null, course.id)}>
          <button
            type="submit"
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
              course.published
                ? "border-green-600/30 text-green-700 dark:text-green-400"
                : "border-black/15 dark:border-white/20 text-black/60 dark:text-white/60"
            }`}
          >
            {course.published ? "Опубликован" : "Черновик — опубликовать"}
          </button>
        </form>
      </div>
      <p className="text-black/60 dark:text-white/60 mt-1">{course.description}</p>

      <div className="mt-8 space-y-8">
        {course.modules.map((module) => (
          <section key={module.id} className="border border-black/10 dark:border-white/10 rounded-xl p-4">
            <h2 className="font-medium mb-3">{module.title}</h2>

            <ul className="space-y-2 mb-4">
              {module.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.06] px-3 py-2 text-sm"
                >
                  <span>
                    {lesson.title}{" "}
                    <span className="text-black/40 dark:text-white/40">
                      ({LESSON_TYPES.find((t) => t.value === lesson.type)?.label})
                    </span>
                  </span>
                  <form
                    action={toggleLessonPublishedAction.bind(null, lesson.id, course.id)}
                  >
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1 text-xs border transition ${
                        lesson.published
                          ? "border-green-600/30 text-green-700 dark:text-green-400"
                          : "border-black/15 dark:border-white/20 text-black/50 dark:text-white/50"
                      }`}
                    >
                      {lesson.published ? "опубликован" : "черновик"}
                    </button>
                  </form>
                </li>
              ))}
              {module.lessons.length === 0 && (
                <li className="text-sm text-black/40 dark:text-white/40">Пока нет уроков</li>
              )}
            </ul>

            <details className="text-sm">
              <summary className="cursor-pointer text-black/60 dark:text-white/60">
                + Добавить урок
              </summary>
              <form action={createLessonAction} className="mt-3 space-y-2">
                <input type="hidden" name="moduleId" value={module.id} />
                <input type="hidden" name="courseId" value={course.id} />
                <input
                  name="title"
                  placeholder="Название урока"
                  required
                  className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
                />
                <select
                  name="type"
                  defaultValue="TEXT"
                  className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
                >
                  {LESSON_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  name="videoUrl"
                  placeholder="Ссылка на видео (embed, необязательно)"
                  className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
                />
                <textarea
                  name="content"
                  placeholder="Текст урока / описание"
                  rows={3}
                  className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full bg-foreground text-background px-4 py-1.5 text-xs font-medium hover:opacity-90 transition"
                >
                  Добавить урок
                </button>
              </form>
            </details>
          </section>
        ))}
      </div>

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer text-black/60 dark:text-white/60">
          + Добавить модуль
        </summary>
        <form action={createModuleAction} className="mt-3 flex gap-2">
          <input type="hidden" name="courseId" value={course.id} />
          <input
            name="title"
            placeholder="Название модуля"
            required
            className="flex-1 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground text-background px-4 py-2 text-xs font-medium hover:opacity-90 transition"
          >
            Добавить
          </button>
        </form>
      </details>
    </main>
  );
}
