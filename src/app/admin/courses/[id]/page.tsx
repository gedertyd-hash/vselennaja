import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import {
  createLessonAction,
  createModuleAction,
  toggleCoursePublishedAction,
  toggleLessonPublishedAction,
  updateMaterialContentAction,
} from "@/app/actions/courses";
import { MATERIAL_TYPE_META } from "@/lib/materials";

const LESSON_TYPES = [
  { value: "TEXT", label: "Текст" },
  { value: "VIDEO", label: "Видео" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-cream focus:border-yolk outline-none transition";

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

  const publishToggle = (
    <form action={toggleCoursePublishedAction.bind(null, course.id)}>
      <button
        type="submit"
        className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
          course.published
            ? "border-sage text-sage"
            : "border-border text-text-muted"
        }`}
      >
        {course.published ? "Опубликован" : "Черновик — опубликовать"}
      </button>
    </form>
  );

  if (course.type !== "COURSE") {
    const lesson = course.modules[0]?.lessons[0];

    return (
      <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
        <Link href="/admin" className="text-sm text-text-muted hover:text-cream transition">
          ← Все материалы
        </Link>

        <div className="flex items-center justify-between mt-2">
          <h1 className="font-display text-2xl font-semibold">
            {course.title}{" "}
            <span className="text-text-faint text-base font-sans font-normal">
              · {MATERIAL_TYPE_META[course.type].singular}
            </span>
          </h1>
          {publishToggle}
        </div>
        <p className="text-text-muted mt-1">{course.description}</p>

        {lesson && (
          <form
            action={updateMaterialContentAction.bind(null, lesson.id, course.id)}
            className="mt-8 space-y-3"
          >
            <label className="block text-sm font-medium">Ссылка на видео (embed)</label>
            <input name="videoUrl" defaultValue={lesson.videoUrl ?? ""} className={inputClass} />

            <label className="block text-sm font-medium">Текст материала (Markdown: **жирный**, ## заголовок, - списки)</label>
            <textarea name="content" defaultValue={lesson.content ?? ""} rows={10} className={inputClass} />

            <button
              type="submit"
              className="rounded-full bg-yolk text-yolk-ink px-6 py-2 text-sm font-semibold hover:bg-yolk-bright transition"
            >
              Сохранить
            </button>
          </form>
        )}
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
      <Link href="/admin" className="text-sm text-text-muted hover:text-cream transition">
        ← Все материалы
      </Link>

      <div className="flex items-center justify-between mt-2">
        <h1 className="font-display text-2xl font-semibold">{course.title}</h1>
        {publishToggle}
      </div>
      <p className="text-text-muted mt-1">{course.description}</p>

      <div className="mt-8 space-y-8">
        {course.modules.map((module) => (
          <section key={module.id} className="border border-border rounded-2xl p-4">
            <h2 className="font-medium mb-3">{module.title}</h2>

            <ul className="space-y-2 mb-4">
              {module.lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-bg-elevated-2 px-3 py-2 text-sm"
                >
                  <span>
                    {lesson.title}{" "}
                    <span className="text-text-faint">
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
                          ? "border-sage text-sage"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {lesson.published ? "опубликован" : "черновик"}
                    </button>
                  </form>
                </li>
              ))}
              {module.lessons.length === 0 && (
                <li className="text-sm text-text-faint">Пока нет уроков</li>
              )}
            </ul>

            <details className="text-sm">
              <summary className="cursor-pointer text-text-muted">+ Добавить урок</summary>
              <form action={createLessonAction} className="mt-3 space-y-2">
                <input type="hidden" name="moduleId" value={module.id} />
                <input type="hidden" name="courseId" value={course.id} />
                <input name="title" placeholder="Название урока" required className={inputClass} />
                <select name="type" defaultValue="TEXT" className={inputClass}>
                  {LESSON_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input name="videoUrl" placeholder="Ссылка на видео (embed, необязательно)" className={inputClass} />
                <textarea name="content" placeholder="Текст урока (поддерживается Markdown)" rows={3} className={inputClass} />
                <button
                  type="submit"
                  className="rounded-full bg-yolk text-yolk-ink px-4 py-1.5 text-xs font-semibold hover:bg-yolk-bright transition"
                >
                  Добавить урок
                </button>
              </form>
            </details>
          </section>
        ))}
      </div>

      <details className="mt-8 text-sm">
        <summary className="cursor-pointer text-text-muted">+ Добавить модуль</summary>
        <form action={createModuleAction} className="mt-3 flex gap-2">
          <input type="hidden" name="courseId" value={course.id} />
          <input name="title" placeholder="Название модуля" required className={`flex-1 ${inputClass}`} />
          <button
            type="submit"
            className="rounded-full bg-yolk text-yolk-ink px-4 py-2 text-xs font-semibold hover:bg-yolk-bright transition"
          >
            Добавить
          </button>
        </form>
      </details>
    </main>
  );
}
