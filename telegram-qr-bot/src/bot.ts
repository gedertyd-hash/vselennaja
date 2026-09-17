import { Bot, InlineKeyboard, InputFile, type Context } from "grammy";
import { config } from "./config.js";
import {
  saveLead,
  updateMarketplace,
  setAwaitingCustomMarketplace,
  isAwaitingCustomMarketplace,
  saveDay1Response,
  saveWeek1Response,
} from "./db.js";
import { MARKETPLACES, marketplaceLabel, CUSTOM_MARKETPLACE_CODE } from "./marketplaces.js";
import {
  WELCOME_TEXT,
  WELCOME_BUTTON,
  MARKETPLACE_QUESTION_TEXT,
  CUSTOM_MARKETPLACE_PROMPT,
  CLOSED_SPACE_TEXT,
  channelButtonLabel,
  DAY1_TEXT,
  DAY1_BUTTON_LIKE,
  DAY1_BUTTON_GETTING_USED,
  DAY1_BUTTON_QUESTION,
  DAY1_THANK_YOU,
  WEEK1_TEXT,
  WEEK1_OPTIONS,
  WEEK1_THANK_YOU,
} from "./funnel-content.js";

export const bot = new Bot(config.botToken);

const MARKETPLACE_CODES = MARKETPLACES.map((m) => m.code).join("|");
const WEEK1_CODES = WEEK1_OPTIONS.map((o) => o.code).join("|");

async function sendClosedSpaceStep(ctx: Context, brandName: string): Promise<void> {
  const keyboard = new InlineKeyboard().url(channelButtonLabel(brandName), config.channelUrl);
  await ctx.reply(CLOSED_SPACE_TEXT, { reply_markup: keyboard });
}

bot.command("start", async (ctx) => {
  const startParam = ctx.match?.toString().trim() || null;
  if (!ctx.from) return;

  const keyboard = new InlineKeyboard().text(WELCOME_BUTTON, `continue:${startParam ?? ""}`);
  await ctx.reply(WELCOME_TEXT, { reply_markup: keyboard });
});

bot.callbackQuery(/^continue:(.*)$/, async (ctx) => {
  const startParam = ctx.match[1] || "";

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);

  const keyboard = new InlineKeyboard();
  MARKETPLACES.forEach((m, i) => {
    keyboard.text(m.label, `mp:${m.code}:${startParam}`);
    if (i < MARKETPLACES.length - 1) keyboard.row();
  });

  await ctx.reply(MARKETPLACE_QUESTION_TEXT, { reply_markup: keyboard });
});

bot.callbackQuery(new RegExp(`^mp:(${MARKETPLACE_CODES}):(.*)$`), async (ctx) => {
  const code = ctx.match[1];
  const startParam = ctx.match[2] || null;
  const user = ctx.from;
  if (!user) return;

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);

  if (code === CUSTOM_MARKETPLACE_CODE) {
    saveLead({
      telegramId: user.id,
      username: user.username ?? null,
      firstName: user.first_name ?? null,
      startParam,
      marketplace: null,
    });
    setAwaitingCustomMarketplace(user.id, true);
    await ctx.reply(CUSTOM_MARKETPLACE_PROMPT);
    return;
  }

  saveLead({
    telegramId: user.id,
    username: user.username ?? null,
    firstName: user.first_name ?? null,
    startParam,
    marketplace: code,
  });

  await sendClosedSpaceStep(ctx, config.brandName);
});

bot.callbackQuery(/^d1:(like|getting_used)$/, async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  saveDay1Response(user.id, ctx.match[1]);
  await ctx.reply(DAY1_THANK_YOU);
});

bot.callbackQuery(new RegExp(`^w1:(${WEEK1_CODES})$`), async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => undefined);
  saveWeek1Response(user.id, ctx.match[1]);
  await ctx.reply(WEEK1_THANK_YOU);
});

// Собирает клавиатуры для отложенных сообщений — используется и планировщиком
// (src/drip.ts), и админскими командами предпросмотра.
export function buildDay1Keyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text(DAY1_BUTTON_LIKE, "d1:like")
    .row()
    .text(DAY1_BUTTON_GETTING_USED, "d1:getting_used")
    .row();
  if (config.supportUrl) {
    keyboard.url(DAY1_BUTTON_QUESTION, config.supportUrl);
  } else {
    keyboard.url(DAY1_BUTTON_QUESTION, config.channelUrl);
  }
  return keyboard;
}

export function buildWeek1Keyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  WEEK1_OPTIONS.forEach((option, i) => {
    keyboard.text(option.label, `w1:${option.code}`);
    if (i < WEEK1_OPTIONS.length - 1) keyboard.row();
  });
  return keyboard;
}

export { DAY1_TEXT, WEEK1_TEXT };

// Общий текст статистики — используется и командой /stats, и еженедельным
// отчётом админам (src/weekly-report.ts).
export async function buildStatsText(): Promise<string> {
  const { countLeads, countByMarketplace, countByDay1Response, countByWeek1Response } =
    await import("./db.js");
  const total = countLeads();
  const byMarketplace = countByMarketplace()
    .map((row) => `  ${marketplaceLabel(row.marketplace)}: ${row.n}`)
    .join("\n");
  const byDay1 = countByDay1Response()
    .map((row) => `  ${row.day1_response ?? "(нет ответа)"}: ${row.n}`)
    .join("\n");
  const byWeek1 = countByWeek1Response()
    .map((row) => `  ${row.week1_response ?? "(нет ответа)"}: ${row.n}`)
    .join("\n");
  return (
    `Всего в базе: ${total}\n\n` +
    `По маркетплейсам:\n${byMarketplace || "  пусто"}\n\n` +
    `Ответы "через день":\n${byDay1 || "  ещё нет"}\n\n` +
    `Ответы "через неделю":\n${byWeek1 || "  ещё нет"}`
  );
}

bot.command("stats", async (ctx) => {
  if (!ctx.from || !config.adminIds.includes(ctx.from.id)) return;
  await ctx.reply(await buildStatsText());
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

bot.command("weekly_report_now", async (ctx) => {
  if (!ctx.from || !config.adminIds.includes(ctx.from.id)) return;
  const { sendWeeklyReport } = await import("./weekly-report.js");
  await sendWeeklyReport();
  await ctx.reply("Готово — еженедельный отчёт отправлен админам (см. выше/отдельным сообщением).");
});

bot.command("funnel_preview", async (ctx) => {
  if (!ctx.from || !config.adminIds.includes(ctx.from.id)) return;
  const { MONTH1_TEXT, MONTH1_READY } = await import("./funnel-content.js");
  await ctx.reply("Превью «через день» (уйдёт только вам):");
  await ctx.reply(DAY1_TEXT, { reply_markup: buildDay1Keyboard() });
  await ctx.reply("Превью «через неделю»:");
  await ctx.reply(WEEK1_TEXT, { reply_markup: buildWeek1Keyboard() });
  const status = MONTH1_READY
    ? "✅ готово к отправке"
    : "⛔ НЕ уйдёт подписчикам (MONTH1_READY = false)";
  await ctx.reply(`Превью «через месяц». Статус: ${status}`);
  await ctx.reply(MONTH1_TEXT);
});

// Свободный текст — используется только для ответа "Другой вариант".
// Зарегистрирован ПОСЛЕ всех команд: иначе он матчит любой текст, включая
// команды типа /stats, и молча проглатывает их (grammy не идёт к следующему
// обработчику, если этот отработал и не позвал next()).
bot.on("message:text", async (ctx) => {
  const user = ctx.from;
  if (!user || !isAwaitingCustomMarketplace(user.id)) return;

  updateMarketplace(user.id, ctx.message.text.trim().slice(0, 200));
  setAwaitingCustomMarketplace(user.id, false);

  await sendClosedSpaceStep(ctx, config.brandName);
});

bot.catch((err) => {
  console.error("Ошибка в обработчике бота:", err);
});
