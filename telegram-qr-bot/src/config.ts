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
  adminIds: (process.env.ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number),
  dbPath: process.env.DB_PATH?.trim() || "./data/leads.db",
};
