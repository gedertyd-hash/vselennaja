import { Bot, InlineKeyboard, InputFile } from "grammy";
import { config } from "./config.js";
import { saveLead } from "./db.js";
import { pickPrize } from "./prizes.js";
import { MARKETPLACES, marketplaceLabel } from "./marketplaces.js";

export const bot = new Bot(config.botToken);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CONSENT_NOTE =
  "Нажимая «Открыть капсулу», вы соглашаетесь на обработку данных вашего " +
  "Telegram-аккаунта (ID, юзернейм, имя) для рассылок и статистики бренда.";

const MARKETPLACE_CODES = MARKETPLACES.map((m) => m.code).join("|");

bot.command("start", async (ctx) => {
  const startParam = ctx.match?.toString().trim() || null;
  const user = ctx.from;
  if (!user) return;

  const keyboard = new InlineKeyboard();
  for (const m of MARKETPLACES) {
    keyboard.text(m.label, `mp:${m.code}:${startParam ?? ""}`).row();
  }

  await ctx.reply(
    `Привет! Это бот ${config.brandName}.\n\n` +
      `Подскажите, откуда вы к нам пришли?`,
    { reply_markup: keyboard }
  );
});

bot.callbackQuery(new RegExp(`^mp:(${MARKETPLACE_CODES}):(.*)$`), async (ctx) => {
  const marketplace = ctx.match[1];
  const startParam = ctx.match[2] || "";

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);

  const keyboard = new InlineKeyboard().text(
    "🎁 Открыть капсулу",
    `open:${marketplace}:${startParam}`
  );

  await ctx.reply(
    `Отлично! Вы отсканировали код с упаковки — внутри капсула с подарком.\n\n` +
      CONSENT_NOTE,
    { reply_markup: keyboard }
  );
});

bot.callbackQuery(new RegExp(`^open:(${MARKETPLACE_CODES}):(.*)$`), async (ctx) => {
  const marketplace = ctx.match[1];
  const startParam = ctx.match[2] || null;
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
    marketplace,
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
  const { countLeads, countByMarketplace } = await import("./db.js");
  const total = countLeads();
  const byMarketplace = countByMarketplace()
    .map((row) => `  ${marketplaceLabel(row.marketplace)}: ${row.n}`)
    .join("\n");
  await ctx.reply(
    `Всего в базе: ${total}\n\nПо маркетплейсам:\n${byMarketplace || "  пусто"}`
  );
});

bot.command("export", async (ctx) => {
  if (!ctx.from || !config.adminIds.includes(ctx.from.id)) return;
  const { getAllLeads } = await import("./db.js");
  const { leadsToCsv } = await import("./csv.js");

  const rows = getAllLeads();
  if (rows.length === 0) {
    await ctx.reply("В базе пока никого нет.");
    return;
  }

  const csv = leadsToCsv(rows);
  const fileName = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  await ctx.replyWithDocument(new InputFile(Buffer.from(csv, "utf-8"), fileName), {
    caption: `Выгрузка базы: ${rows.length} чел. Открывается в Excel/Google Таблицах.`,
  });
});

bot.catch((err) => {
  console.error("Ошибка в обработчике бота:", err);
});
