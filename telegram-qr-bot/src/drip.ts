import cron from "node-cron";
import { GrammyError } from "grammy";
import { bot, buildDay1Keyboard, buildWeek1Keyboard, DAY1_TEXT, WEEK1_TEXT } from "./bot.js";
import { MONTH1_TEXT } from "./funnel-content.js";
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

  for (const telegramId of getDueMonth1()) {
    const result = await sendStep(telegramId, MONTH1_TEXT);
    if (result !== "failed") markMonth1Sent(telegramId);
    await sleep(50);
  }
}

export function scheduleDrip(): void {
  // Проверка каждые 15 минут — достаточно часто для точности "через день/неделю/месяц".
  cron.schedule("*/15 * * * *", () => {
    runDripCheck().catch((err) => console.error("Ошибка отложенных сообщений:", err));
  });
  console.log("Отложенные сообщения (день/неделя/месяц) запланированы.");
}
