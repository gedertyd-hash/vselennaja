import cron from "node-cron";
import { bot, buildStatsText } from "./bot.js";
import { config } from "./config.js";

// Каждый понедельник — короткий отчёт со статистикой ТОЛЬКО админам
// (ADMIN_IDS). Подписчики ничего по этому расписанию не получают —
// для них есть отдельная цепочка через день/неделю/месяц (src/drip.ts).
export async function sendWeeklyReport(): Promise<void> {
  const text = `📊 Еженедельный отчёт по боту\n\n${await buildStatsText()}`;
  for (const adminId of config.adminIds) {
    await bot.api.sendMessage(adminId, text).catch((err) => {
      console.error(`Не удалось отправить еженедельный отчёт админу ${adminId}:`, err);
    });
  }
}

export function scheduleWeeklyReport(): void {
  cron.schedule(
    config.broadcastCron,
    () => {
      sendWeeklyReport().catch((err) => console.error("Ошибка еженедельного отчёта:", err));
    },
    { timezone: config.broadcastTimezone }
  );

  console.log(
    `Еженедельный отчёт админам запланирован: "${config.broadcastCron}" (${config.broadcastTimezone}).`
  );
}
