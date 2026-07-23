import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@iishnitsa.local" },
    update: {},
    create: {
      email: "admin@iishnitsa.local",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.course.upsert({
    where: { slug: "dobro-pozhalovat-v-club" },
    update: {},
    create: {
      slug: "dobro-pozhalovat-v-club",
      title: "Добро пожаловать в «ИИшницу»",
      description: "С чего начать в закрытом клубе и как тут всё устроено.",
      type: "GUIDE",
      level: "BEGINNER",
      tag: "Основы",
      published: true,
      modules: {
        create: [
          {
            title: "Материал",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "content",
                  title: "Добро пожаловать в «ИИшницу»",
                  type: "TEXT",
                  content:
                    "Это демо-гайд. Отредактируйте или удалите его в админке (/admin) и добавьте свои материалы.",
                  published: true,
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { slug: "30-promptov-claude" },
    update: {},
    create: {
      slug: "30-promptov-claude",
      title: "30 промптов для Claude, которые реально работают",
      description: "Подборка рабочих промптов на каждый день — от текста до анализа данных.",
      type: "GUIDE",
      level: "BEGINNER",
      tag: "Claude",
      published: true,
      modules: {
        create: [
          {
            title: "Материал",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "content",
                  title: "30 промптов для Claude",
                  type: "TEXT",
                  content: "1. Сожми текст до трёх тезисов...\n2. Найди слабые места в аргументации...",
                  published: true,
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { slug: "claude-s-0-do-pro" },
    update: {},
    create: {
      slug: "claude-s-0-do-pro",
      title: "Claude с нуля до PRO",
      description: "Системный курс: от первого запроса до автоматизации рабочих процессов.",
      type: "COURSE",
      level: "BEGINNER",
      tag: "Claude",
      published: true,
      modules: {
        create: [
          {
            title: "Введение",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "chto-takoe-claude",
                  title: "Что такое Claude и зачем он вам",
                  type: "TEXT",
                  content: "Claude — это модель от Anthropic. В этом уроке разберём, для каких задач она подходит лучше всего.",
                  published: true,
                  order: 0,
                },
                {
                  slug: "pervyy-zapros",
                  title: "Первый запрос",
                  type: "TEXT",
                  content: "Как сформулировать запрос, чтобы получить полезный ответ с первого раза.",
                  published: true,
                  order: 1,
                },
              ],
            },
          },
          {
            title: "Продвинутая работа",
            order: 1,
            lessons: {
              create: [
                {
                  slug: "proekty-i-pamyat",
                  title: "Проекты и долгая память",
                  type: "TEXT",
                  content: "Как использовать Projects, чтобы Claude помнил контекст между разговорами.",
                  published: true,
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { slug: "kak-agentstvo-uskorilo-otchety" },
    update: {},
    create: {
      slug: "kak-agentstvo-uskorilo-otchety",
      title: "Как маркетинговое агентство сократило отчёты в 4 раза",
      description: "Разбор реального кейса: связка Claude + таблицы вместо ручной сборки отчётов.",
      type: "CASE",
      level: "INTERMEDIATE",
      tag: "AI-агенты",
      published: true,
      modules: {
        create: [
          {
            title: "Материал",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "content",
                  title: "Кейс: отчёты в 4 раза быстрее",
                  type: "TEXT",
                  content: "Было: 6 часов ручной сборки отчёта каждую неделю. Стало: 90 минут с автоматической сверкой цифр.",
                  published: true,
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.course.upsert({
    where: { slug: "vorkshop-svой-ai-agent" },
    update: {},
    create: {
      slug: "vorkshop-svой-ai-agent",
      title: "Воркшоп: собери своего ИИ-агента за вечер",
      description: "Живой разбор с записью — от идеи до рабочего прототипа.",
      type: "WORKSHOP",
      level: "ADVANCED",
      tag: "AI-агенты",
      published: true,
      modules: {
        create: [
          {
            title: "Материал",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "content",
                  title: "Запись воркшопа",
                  type: "TEXT",
                  content: "Запись и конспект воркшопа появятся здесь после следующего эфира.",
                  published: true,
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log({ admin: admin.email });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
