import { Bot, InlineKeyboard } from "grammy";
import { config } from "./config.js";
import { saveLead } from "./db.js";
import { pickPrize } from "./prizes.js";

export const bot = new Bot(config.botToken);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CONSENT_NOTE =
  "Нажимая «Открыть капсулу», вы соглашаетесь на обработку данных вашего " +
  "Telegram-аккаунта (ID, юзернейм, имя) для рассылок и статистики бренда.";

bot.command("start", async (ctx) => {
  const startParam = ctx.match?.toString().trim() || null;
  const user = ctx.from;
  if (!user) return;

  const keyboard = new InlineKeyboard().text("🎁 Открыть капсулу", `open:${startParam ?? ""}`);

  await ctx.reply(
    `Привет! Это бот ${config.brandName}.\n\n` +
      `Вы отсканировали код с упаковки — внутри капсула с подарком.\n\n` +
      CONSENT_NOTE,
    { reply_markup: keyboard }
  );
});

bot.callbackQuery(/^open:(.*)$/, async (ctx) => {
  const startParam = ctx.match[1] || null;
  const user = ctx.from;

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);

  await ctx.replyWithChatAction("typing");
  await sleep(700);
  await ctx.reply("Открываем капсулу... 🔎");
  await sleep(1200);

  const prize = pickPrize();

  saveLead({
    telegramId: user.id,
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    startParam,
    prize,
  });

  const channelKeyboard = new InlineKeyboard().url(
    `Перейти в канал ${config.brandName}`,
    config.channelUrl
  );

  await ctx.reply(
    `🎉 Вам попалось:\n\n${prize}\n\n` +
      `Промокод действует на сайте и в канале бренда — там же новинки, ` +
      `розыгрыши и распродажи для своих.`,
    { reply_markup: channelKeyboard }
  );
});

bot.command("stats", async (ctx) => {
  if (!ctx.from || !config.adminIds.includes(ctx.from.id)) return;
  const { countLeads, countByBatch } = await import("./db.js");
  const total = countLeads();
  const byBatch = countByBatch()
    .map((row) => `  ${row.start_param ?? "(без метки)"}: ${row.n}`)
    .join("\n");
  await ctx.reply(`Всего в базе: ${total}\n\nПо партиям/QR:\n${byBatch || "  пусто"}`);
});

bot.catch((err) => {
  console.error("Ошибка в обработчике бота:", err);
});
