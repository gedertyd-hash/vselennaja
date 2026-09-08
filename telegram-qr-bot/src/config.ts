import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Не задана переменная окружения ${name} (см. .env.example)`);
  }
  return value;
}

export const config = {
  botToken: required("BOT_TOKEN"),
  brandName: process.env.BRAND_NAME?.trim() || "Бренд",
  channelUrl: required("CHANNEL_URL"),
  // Ссылка на тг тех поддержки для кнопки "Есть вопрос" (t.me/username).
  // Если не задана, кнопка поведёт в канал бренда — см. использование в bot.ts.
  supportUrl: process.env.SUPPORT_URL?.trim() || "",
  adminIds: (process.env.ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number),
  dbPath: process.env.DB_PATH?.trim() || "./data/leads.db",
  // По умолчанию — каждый понедельник в 10:00 по Москве.
  broadcastCron: process.env.BROADCAST_CRON?.trim() || "0 10 * * 1",
  broadcastTimezone: process.env.BROADCAST_TZ?.trim() || "Europe/Moscow",
};
