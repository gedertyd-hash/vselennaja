import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/dal";
import { IconChevronRight } from "@/components/icons";
import { MATERIAL_TYPE_META, MATERIAL_TYPE_ORDER, pluralizeCount } from "@/lib/materials";

export default async function MaterialsHubPage() {
  await requireSession();

  const counts = await prisma.course.groupBy({
    by: ["type"],
    where: { published: true },
    _count: { _all: true },
  });
  const countByType = Object.fromEntries(counts.map((c) => [c.type, c._count._all]));

  return (
    <main className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold">Материалы</h1>
      <p className="text-text-muted mt-2">
        Выбери раздел — гайды, курсы, юзкейсы и воркшопы.
      </p>

      <div className="mt-8 rounded-2xl border border-border overflow-hidden divide-y divide-border">
        {MATERIAL_TYPE_ORDER.map((type) => {
          const meta = MATERIAL_TYPE_META[type];
          const Icon = meta.icon;
          const count = countByType[type] ?? 0;
          return (
            <Link
              key={type}
              href={meta.href}
              className="flex items-center gap-4 px-5 py-4 bg-bg-elevated hover:bg-bg-elevated-2 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-bg-elevated-2 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-yolk" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{meta.label}</p>
                <p className="text-sm text-text-muted">
                  {pluralizeCount(count, meta.singular)}
                </p>
              </div>
              <IconChevronRight className="w-5 h-5 text-text-faint shrink-0" />
            </Link>
          );
        })}
      </div>
    </main>
  );
}
