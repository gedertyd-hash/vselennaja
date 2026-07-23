import Link from "next/link";
import { IconCheck } from "@/components/icons";
import { requireSession } from "@/lib/dal";

const STEPS = [
  {
    title: "Добро пожаловать в «ИИшницу»",
    body: "Закрытый клуб про ИИ: гайды, курсы, юзкейсы и воркшопы по Claude, ChatGPT и агентам. Заходите из Telegram или с сайта — прогресс общий.",
  },
  {
    title: "Правила клуба",
    body: "Материалы только для личного использования. Делитесь опытом в комьюнити, а не ссылками на закрытый контент.",
  },
  {
    title: "С чего начать",
    body: "Загляните в «Материалы» → «Гайды» — там самые короткие и практичные вещи, с них проще всего начать.",
  },
];

export default async function StartPage() {
  await requireSession();

  return (
    <main className="flex-1 px-8 py-10 max-w-2xl mx-auto w-full">
      <h1 className="font-display text-3xl font-semibold">Старт</h1>
      <p className="text-text-muted mt-2">Коротко о клубе, прежде чем нырять в материалы.</p>

      <div className="mt-8 space-y-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="rounded-2xl border border-border bg-bg-elevated p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-bg-elevated-2 text-yolk flex items-center justify-center text-xs font-semibold shrink-0">
                {i + 1}
              </span>
              <h2 className="font-medium">{step.title}</h2>
            </div>
            <p className="text-sm text-text-muted leading-relaxed pl-9">{step.body}</p>
          </div>
        ))}
      </div>

      <Link
        href="/materials/guides"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-yolk text-yolk-ink px-6 py-2.5 text-sm font-semibold hover:bg-yolk-bright transition"
      >
        <IconCheck className="w-4 h-4" />
        К первому гайду
      </Link>
    </main>
  );
}
