import { bot } from "./bot.js";
import { scheduleBroadcast } from "./broadcast.js";

async function main() {
  console.log("Бот запускается...");
  scheduleBroadcast();
  await bot.start({
    onStart: (info) => console.log(`Бот @${info.username} запущен (long polling).`),
  });
}

main().catch((err) => {
  console.error("Не удалось запустить бота:", err);
  process.exit(1);
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
