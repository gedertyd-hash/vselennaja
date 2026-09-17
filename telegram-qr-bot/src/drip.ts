import cron from "node-cron";
import { GrammyError } from "grammy";
import { bot, buildDay1Keyboard, buildWeek1Keyboard, DAY1_TEXT, WEEK1_TEXT } from "./bot.js";
import { config } from "./config.js";
import { MONTH1_TEXT, MONTH1_READY } from "./funnel-content.js";
import {
  getDueDay1,
  getDueWeek1,
  getDueMonth1,
  markDay1Sent,
  markWeek1Sent,
  markMonth1Sent,
  markBlocked,
} from "./db.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendStep(
  telegramId: number,
  text: string,
  keyboard?: ReturnType<typeof buildDay1Keyboard>
): Promise<"sent" | "blocked" | "failed"> {
  try {
    await bot.api.sendMessage(telegramId, text, keyboard ? { reply_markup: keyboard } : undefined);
    return "sent";
  } catch (err) {
    if (err instanceof GrammyError && err.error_code === 403) {
      markBlocked(telegramId);
      return "blocked";
    }
    console.error(`Не удалось отправить отложенное сообщение ${telegramId}:`, err);
    return "failed";
  }
}

// Чтобы не слать это предупреждение админам каждые 15 минут, пока
// MONTH1_READY остаётся false, — только один раз за время работы процесса.
let month1WarningSent = false;

export async function runDripCheck(): Promise<void> {
  for (const telegramId of getDueDay1()) {
    const result = await sendStep(telegramId, DAY1_TEXT, buildDay1Keyboard());
    if (result !== "failed") markDay1Sent(telegramId);
    await sleep(50);
  }

  for (const telegramId of getDueWeek1()) {
    const result = await sendStep(telegramId, WEEK1_TEXT, buildWeek1Keyboard());
    if (result !== "failed") markWeek1Sent(telegramId);
    await sleep(50);
  }

  const dueMonth1 = getDueMonth1();
  if (dueMonth1.length === 0) {
    // ничего не просрочено — нечего делать
  } else if (!MONTH1_READY) {
    if (!month1WarningSent) {
      month1WarningSent = true;
      const warning =
        `⚠️ ${dueMonth1.length} подписчик(ов) уже пора получить сообщение "через месяц", ` +
        `но MONTH1_READY = false в src/funnel-content.ts — им ничего не отправлено. ` +
        `Замените MONTH1_TEXT на реальный анонс и поставьте MONTH1_READY = true.`;
      for (const adminId of config.adminIds) {
        await bot.api.sendMessage(adminId, warning).catch(() => undefined);
      }
    }
  } else {
    for (const telegramId of dueMonth1) {
      const result = await sendStep(telegramId, MONTH1_TEXT);
      if (result !== "failed") markMonth1Sent(telegramId);
      await sleep(50);
    }
  }
}

export function scheduleDrip(): void {
  // Проверка каждые 15 минут — достаточно часто для точности "через день/неделю/месяц".
  cron.schedule("*/15 * * * *", () => {
    runDripCheck().catch((err) => console.error("Ошибка отложенных сообщений:", err));
  });
  console.log("Отложенные сообщения (день/неделя/месяц) запланированы.");
}
