import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { YolkMark } from "@/components/icons";
import { CLUB_JOIN_URL } from "@/lib/constants";

const FREE_GUIDES = [
  {
    slug: "claude-dlya-novichkov",
    title: "Claude для новичков",
    description: "Пошагово настраиваешь Claude и получаешь первый рабочий результат — с нуля, без опыта.",
    image: "/guides/claude-guide-hero-v2.png",
  },
  {
    slug: "35-promptov-kotorye-realno-rabotayut",
    title: "35 промптов, которые реально работают",
    description: "Готовая библиотека запросов для работы, текстов, документов и жизни — просто копируешь и используешь.",
    image: "/guides/promptlib-hero.png",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "var(--yolk)" }}
        />

        <YolkMark className="w-36 h-36 sm:w-44 sm:h-44 relative mx-auto" />

        <div className="max-w-2xl mx-auto mt-8 space-y-5 relative">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Разберись в ИИ, пока другие ещё гуглят промпты
          </h1>
          <p className="text-base text-cream/70 leading-relaxed max-w-md mx-auto">
            «ИИшница» — гайды, курсы, юзкейсы и воркшопы по Claude, ChatGPT и
            ИИ-агентам. Начни бесплатно с гайда, а дальше — заходишь в
            закрытый клуб и учишься в удобном темпе.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8 relative">
          <Link
            href="#free-guides"
            className="rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition"
          >
            Начать бесплатно
          </Link>
          <Link
            href={CLUB_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-yolk/40 px-6 py-2.5 text-sm font-medium text-cream hover:bg-bg-elevated transition"
          >
            Вступить в клуб
          </Link>
        </div>
      </section>

      <section id="free-guides" className="px-6 py-14 sm:py-16 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-balance text-center">
            Начать бесплатно
          </h2>
          <p className="text-text-muted text-center mt-3 max-w-md mx-auto leading-relaxed">
            Два гайда, которые можно забрать прямо сейчас — без регистрации и
            оплаты.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {FREE_GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/free/guides/${guide.slug}`}
                className="group rounded-2xl border border-border bg-bg-elevated overflow-hidden hover:border-yolk/40 transition flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={guide.image}
                  alt={guide.title}
                  className="w-full aspect-[16/10] object-cover"
                />
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display text-lg font-semibold text-balance">
                    {guide.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed mt-2 flex-1">
                    {guide.description}
                  </p>
                  <span className="text-yolk-bright text-sm font-medium mt-4 group-hover:underline">
                    Читать бесплатно →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:py-16 border-t border-border">
        <div className="max-w-2xl mx-auto rounded-2xl border border-yolk/40 bg-bg-elevated px-6 py-8 sm:px-10 sm:py-10 text-center">
          <p className="font-display text-xl sm:text-2xl font-semibold mb-3 text-balance">
            Клуб «ИИшница»
          </p>
          <p className="text-text-muted mb-6 leading-relaxed max-w-lg mx-auto">
            Внутри — курсы «Claude под ключ» и «ChatGPT под ключ», разбор
            Connectors, Cowork, Claude Code, готовые шаблоны под разные роли
            и живое сообщество, где можно спросить и свериться с другими.
            Подписка — 2690 ₽/мес.
          </p>
          <Link
            href={CLUB_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-yolk text-yolk-ink font-medium px-6 py-2.5 hover:bg-yolk-bright transition"
          >
            Вступить в клуб
          </Link>
        </div>
      </section>

      <section className="px-6 pb-20 pt-2 text-center">
        <p className="text-text-faint text-sm mb-4">Уже проходишь курсы на платформе?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-cream hover:bg-bg-elevated transition"
          >
            Зарегистрироваться
          </Link>
        </div>
      </section>
    </main>
  );
}
