import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";

export default async function CoursesPage() {
  await requireSession();

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        include: { lessons: { where: { published: true } } },
      },
    },
  });

  return (
    <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">Курсы</h1>

      {courses.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          Пока нет опубликованных курсов.
        </p>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => {
            const lessonCount = course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            );
            return (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="block rounded-xl border border-black/10 dark:border-white/10 p-4 hover:border-black/30 dark:hover:border-white/30 transition"
                >
                  <h2 className="font-medium">{course.title}</h2>
                  <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                    {course.description}
                  </p>
                  <p className="text-xs text-black/40 dark:text-white/40 mt-2">
                    {lessonCount} {lessonCount === 1 ? "урок" : "уроков"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
