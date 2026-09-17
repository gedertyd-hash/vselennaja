import cron from "node-cron";
import { GrammyError } from "grammy";
import { bot } from "./bot.js";
import { config } from "./config.js";
import { BROADCAST_TEXT, BROADCAST_READY } from "./broadcast-content.js";
import { getBroadcastTargets, markBlocked } from "./db.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOne(telegramId: number): Promise<"sent" | "blocked" | "failed"> {
  try {
    await bot.api.sendMessage(telegramId, BROADCAST_TEXT);
    return "sent";
  } catch (err) {
    if (err instanceof GrammyError && err.error_code === 403) {
      markBlocked(telegramId);
      return "blocked";
    }
    if (err instanceof GrammyError && err.error_code === 429) {
      const retryAfterMs = (err.parameters?.retry_after ?? 1) * 1000;
      await sleep(retryAfterMs);
      try {
        await bot.api.sendMessage(telegramId, BROADCAST_TEXT);
        return "sent";
      } catch {
        return "failed";
      }
    }
    console.error(`Не удалось отправить рассылку ${telegramId}:`, err);
    return "failed";
  }
}

export async function runBroadcast(): Promise<{ sent: number; blocked: number; failed: number }> {
  if (!BROADCAST_READY) {
    const warning =
      "⚠️ Еженедельная рассылка НЕ отправлена: BROADCAST_READY = false в " +
      "src/broadcast-content.ts. Замените BROADCAST_TEXT на реальный текст и " +
      "поставьте BROADCAST_READY = true — иначе рассылка продолжит пропускаться " +
      "каждый понедельник.";
    for (const adminId of config.adminIds) {
      await bot.api.sendMessage(adminId, warning).catch(() => undefined);
    }
    return { sent: 0, blocked: 0, failed: 0 };
  }

  const targets = getBroadcastTargets();
  let sent = 0;
  let blocked = 0;
  let failed = 0;

  for (const telegramId of targets) {
    const result = await sendOne(telegramId);
    if (result === "sent") sent++;
    else if (result === "blocked") blocked++;
    else failed++;
    // ~20 сообщений в секунду — с запасом под лимиты Telegram.
    await sleep(50);
  }

  const summary =
    `Еженедельная рассылка завершена.\n` +
    `Всего получателей: ${targets.length}\n` +
    `Отправлено: ${sent}\n` +
    `Заблокировали бота: ${blocked}\n` +
    `Ошибок: ${failed}`;

  for (const adminId of config.adminIds) {
    await bot.api.sendMessage(adminId, summary).catch(() => undefined);
  }

  return { sent, blocked, failed };
}

export function scheduleBroadcast(): void {
  cron.schedule(config.broadcastCron, () => {
    runBroadcast().catch((err) => console.error("Ошибка еженедельной рассылки:", err));
  }, { timezone: config.broadcastTimezone });

  console.log(
    `Рассылка запланирована: "${config.broadcastCron}" (${config.broadcastTimezone}).`
  );
}
