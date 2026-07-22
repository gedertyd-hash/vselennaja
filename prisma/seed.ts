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
    where: { email: "admin@vselennaja.local" },
    update: {},
    create: {
      email: "admin@vselennaja.local",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "start" },
    update: {},
    create: {
      slug: "start",
      title: "Быстрый старт",
      description: "Первый курс платформы — пример структуры уроков.",
      published: true,
      modules: {
        create: [
          {
            title: "Введение",
            order: 0,
            lessons: {
              create: [
                {
                  slug: "dobro-pozhalovat",
                  title: "Добро пожаловать",
                  type: "TEXT",
                  content:
                    "Это пример урока. Отредактируйте или удалите его в админке (/admin) и добавьте свои материалы.",
                  published: true,
                  order: 0,
                },
                {
                  slug: "kak-polzovatsya-platformoy",
                  title: "Как пользоваться платформой",
                  type: "GUIDE",
                  content:
                    "Гайд: проходите уроки по порядку и отмечайте их как пройденные — прогресс сохраняется.",
                  published: true,
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log({ admin: admin.email, course: course.slug });
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
