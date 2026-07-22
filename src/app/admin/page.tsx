import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { createCourseAction } from "@/app/actions/courses";

export default async function AdminPage() {
  await requireAdmin();

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { modules: { include: { lessons: true } } },
  });

  return (
    <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Админка</h1>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Новый курс</h2>
        <form action={createCourseAction} className="space-y-3">
          <input
            name="title"
            placeholder="Название курса"
            required
            className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Короткое описание"
            rows={2}
            className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground text-background px-6 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            Создать
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Курсы</h2>
        <ul className="space-y-2">
          {courses.map((course) => {
            const lessonCount = course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            );
            return (
              <li key={course.id}>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 px-4 py-3 hover:border-black/30 dark:hover:border-white/30 transition"
                >
                  <span>{course.title}</span>
                  <span className="text-xs text-black/40 dark:text-white/40">
                    {course.published ? "опубликован" : "черновик"} ·{" "}
                    {lessonCount} уроков
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
