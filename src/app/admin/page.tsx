import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { CreateMaterialForm } from "@/components/CreateMaterialForm";
import { MATERIAL_TYPE_META } from "@/lib/materials";

export default async function AdminPage() {
  await requireAdmin();

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { modules: { include: { lessons: true } } },
  });

  return (
    <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
      <h1 className="font-display text-2xl font-semibold mb-6">Админка</h1>

      <section className="mb-10">
        <h2 className="font-medium mb-3">Новый материал</h2>
        <CreateMaterialForm />
      </section>

      <section>
        <h2 className="font-medium mb-3">Все материалы</h2>
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
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3 hover:border-yolk/40 transition"
                >
                  <span>
                    {course.title}{" "}
                    <span className="text-text-faint">
                      · {MATERIAL_TYPE_META[course.type].singular}
                    </span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {course.published ? "опубликован" : "черновик"}
                    {course.type === "COURSE" && ` · ${lessonCount} уроков`}
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
