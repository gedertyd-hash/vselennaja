import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config.js";

mkdirSync(dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    username TEXT,
    first_name TEXT,
    start_param TEXT,
    marketplace TEXT,
    prize TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    UNIQUE(telegram_id)
  );
`);

// На случай базы, созданной до появления новых колонок.
const existingColumns = new Set(
  (db.prepare("PRAGMA table_info(leads)").all() as Array<{ name: string }>).map(
    (col) => col.name
  )
);
if (!existingColumns.has("marketplace")) {
  db.exec("ALTER TABLE leads ADD COLUMN marketplace TEXT");
}
if (!existingColumns.has("blocked")) {
  db.exec("ALTER TABLE leads ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0");
}
if (!existingColumns.has("awaiting_custom_marketplace")) {
  db.exec(
    "ALTER TABLE leads ADD COLUMN awaiting_custom_marketplace INTEGER NOT NULL DEFAULT 0"
  );
}
if (!existingColumns.has("day1_sent_at")) {
  db.exec("ALTER TABLE leads ADD COLUMN day1_sent_at TEXT");
  db.exec("ALTER TABLE leads ADD COLUMN day1_response TEXT");
}
if (!existingColumns.has("week1_sent_at")) {
  db.exec("ALTER TABLE leads ADD COLUMN week1_sent_at TEXT");
  db.exec("ALTER TABLE leads ADD COLUMN week1_response TEXT");
}
if (!existingColumns.has("month1_sent_at")) {
  db.exec("ALTER TABLE leads ADD COLUMN month1_sent_at TEXT");
}

export interface Lead {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  startParam: string | null;
  marketplace: string | null;
}

const upsertStmt = db.prepare(`
  INSERT INTO leads (telegram_id, username, first_name, start_param, marketplace, first_seen_at, last_seen_at)
  VALUES (@telegramId, @username, @firstName, @startParam, @marketplace, @now, @now)
  ON CONFLICT(telegram_id) DO UPDATE SET
    username = excluded.username,
    first_name = excluded.first_name,
    last_seen_at = excluded.last_seen_at,
    -- не затираем партию/маркетплейс повторным сканированием тем же человеком,
    -- если у него уже есть сохранённые значения
    start_param = COALESCE(leads.start_param, excluded.start_param),
    marketplace = COALESCE(leads.marketplace, excluded.marketplace)
`);

export function saveLead(lead: Lead): void {
  upsertStmt.run({
    telegramId: lead.telegramId,
    username: lead.username,
    firstName: lead.firstName,
    startParam: lead.startParam,
    marketplace: lead.marketplace,
    now: new Date().toISOString(),
  });
}

export function updateMarketplace(telegramId: number, marketplace: string): void {
  db.prepare("UPDATE leads SET marketplace = ? WHERE telegram_id = ?").run(
    marketplace,
    telegramId
  );
}

export function setAwaitingCustomMarketplace(telegramId: number, value: boolean): void {
  db.prepare("UPDATE leads SET awaiting_custom_marketplace = ? WHERE telegram_id = ?").run(
    value ? 1 : 0,
    telegramId
  );
}

export function isAwaitingCustomMarketplace(telegramId: number): boolean {
  const row = db
    .prepare("SELECT awaiting_custom_marketplace FROM leads WHERE telegram_id = ?")
    .get(telegramId) as { awaiting_custom_marketplace: number } | undefined;
  return row?.awaiting_custom_marketplace === 1;
}

export function countLeads(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM leads").get() as { n: number }).n;
}

export function countByMarketplace(): Array<{ marketplace: string | null; n: number }> {
  return db
    .prepare(
      "SELECT marketplace, COUNT(*) AS n FROM leads GROUP BY marketplace ORDER BY n DESC"
    )
    .all() as Array<{ marketplace: string | null; n: number }>;
}

export interface LeadRow {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  start_param: string | null;
  marketplace: string | null;
  prize: string | null;
  blocked: number;
  day1_response: string | null;
  week1_response: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export function getAllLeads(): LeadRow[] {
  return db
    .prepare(
      `SELECT telegram_id, username, first_name, start_param, marketplace, prize, blocked,
              day1_response, week1_response, first_seen_at, last_seen_at
       FROM leads ORDER BY first_seen_at DESC`
    )
    .all() as LeadRow[];
}

export function markBlocked(telegramId: number): void {
  db.prepare("UPDATE leads SET blocked = 1 WHERE telegram_id = ?").run(telegramId);
}

// --- Отложенная цепочка: +1 день / +1 неделя / +1 месяц после первого контакта ---

function dueTelegramIds(sentAtColumn: string, olderThanMs: number): number[] {
  const threshold = new Date(Date.now() - olderThanMs).toISOString();
  return (
    db
      .prepare(
        `SELECT telegram_id FROM leads
         WHERE blocked = 0
           AND awaiting_custom_marketplace = 0
           AND marketplace IS NOT NULL
           AND ${sentAtColumn} IS NULL
           AND first_seen_at <= ?`
      )
      .all(threshold) as Array<{ telegram_id: number }>
  ).map((row) => row.telegram_id);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDueDay1(): number[] {
  return dueTelegramIds("day1_sent_at", 1 * DAY_MS);
}

export function getDueWeek1(): number[] {
  return dueTelegramIds("week1_sent_at", 7 * DAY_MS);
}

export function getDueMonth1(): number[] {
  return dueTelegramIds("month1_sent_at", 30 * DAY_MS);
}

export function markDay1Sent(telegramId: number): void {
  db.prepare("UPDATE leads SET day1_sent_at = ? WHERE telegram_id = ?").run(
    new Date().toISOString(),
    telegramId
  );
}

export function markWeek1Sent(telegramId: number): void {
  db.prepare("UPDATE leads SET week1_sent_at = ? WHERE telegram_id = ?").run(
    new Date().toISOString(),
    telegramId
  );
}

export function markMonth1Sent(telegramId: number): void {
  db.prepare("UPDATE leads SET month1_sent_at = ? WHERE telegram_id = ?").run(
    new Date().toISOString(),
    telegramId
  );
}

export function saveDay1Response(telegramId: number, response: string): void {
  db.prepare("UPDATE leads SET day1_response = ? WHERE telegram_id = ?").run(
    response,
    telegramId
  );
}

export function saveWeek1Response(telegramId: number, response: string): void {
  db.prepare("UPDATE leads SET week1_response = ? WHERE telegram_id = ?").run(
    response,
    telegramId
  );
}

export function countByDay1Response(): Array<{ day1_response: string | null; n: number }> {
  return db
    .prepare(
      "SELECT day1_response, COUNT(*) AS n FROM leads WHERE day1_sent_at IS NOT NULL GROUP BY day1_response ORDER BY n DESC"
    )
    .all() as Array<{ day1_response: string | null; n: number }>;
}

export function countByWeek1Response(): Array<{ week1_response: string | null; n: number }> {
  return db
    .prepare(
      "SELECT week1_response, COUNT(*) AS n FROM leads WHERE week1_sent_at IS NOT NULL GROUP BY week1_response ORDER BY n DESC"
    )
    .all() as Array<{ week1_response: string | null; n: number }>;
}
