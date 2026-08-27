import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MarkdownContent } from "@/components/MarkdownContent";

const CLUB_JOIN_LINK = "#"; // TODO: заменить на реальную ссылку на клуб

export default async function PublicGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const material = await prisma.course.findFirst({
    where: { slug, published: true, type: { not: "COURSE" } },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { published: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!material) notFound();

  const lesson = material.modules[0]?.lessons[0];

  return (
    <main className="min-h-screen bg-bg text-cream">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-egg.jpg"
            alt="ИИшница"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <span className="font-display text-lg font-semibold">ИИшница</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-semibold text-balance">{material.title}</h1>

        {!lesson ? (
          <p className="text-text-muted mt-10">Материал скоро появится.</p>
        ) : (
          <div className="mt-8">
            {lesson.videoUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden border border-border mb-6">
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
            {lesson.content && <MarkdownContent content={lesson.content} />}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-yolk/40 bg-bg-elevated px-6 py-6 text-center">
          <p className="font-display text-xl font-semibold mb-2">Хочешь идти дальше не вслепую?</p>
          <p className="text-text-muted mb-5 leading-relaxed">
            В клубе «ИИшница» — готовые шаблоны под разные роли, разбор Connectors, Cowork, Claude Code
            и живое сообщество, где можно спросить. Подписка — 2490 ₽.
          </p>
          <Link
            href={CLUB_JOIN_LINK}
            className="inline-block rounded-full bg-yolk text-yolk-ink font-medium px-6 py-2.5 hover:bg-yolk-bright transition"
          >
            Вступить в клуб
          </Link>
        </div>
      </div>
    </main>
  );
}
