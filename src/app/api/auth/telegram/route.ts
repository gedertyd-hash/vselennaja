import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { verifyTelegramInitData } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { initData } = await req.json();

  if (typeof initData !== "string" || !initData) {
    return NextResponse.json({ error: "initData is required" }, { status: 400 });
  }

  const result = verifyTelegramInitData(initData);
  if (!result) {
    return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 });
  }

  const { user: tgUser } = result;
  const telegramId = String(tgUser.id);

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      telegramUsername: tgUser.username,
      avatarUrl: tgUser.photo_url,
    },
    create: {
      telegramId,
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Telegram User",
      telegramUsername: tgUser.username,
      avatarUrl: tgUser.photo_url,
      role: (await prisma.user.count()) === 0 ? "ADMIN" : "STUDENT",
    },
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true });
}
