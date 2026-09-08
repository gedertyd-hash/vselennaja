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

// На случай базы, созданной до появления колонки marketplace.
const hasMarketplaceColumn = (
  db.prepare("PRAGMA table_info(leads)").all() as Array<{ name: string }>
).some((col) => col.name === "marketplace");
if (!hasMarketplaceColumn) {
  db.exec("ALTER TABLE leads ADD COLUMN marketplace TEXT");
}

export interface Lead {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  startParam: string | null;
  marketplace: string | null;
  prize: string | null;
}

const upsertStmt = db.prepare(`
  INSERT INTO leads (telegram_id, username, first_name, start_param, marketplace, prize, first_seen_at, last_seen_at)
  VALUES (@telegramId, @username, @firstName, @startParam, @marketplace, @prize, @now, @now)
  ON CONFLICT(telegram_id) DO UPDATE SET
    username = excluded.username,
    first_name = excluded.first_name,
    last_seen_at = excluded.last_seen_at,
    -- не затираем партию/маркетплейс/приз повторным сканированием тем же человеком,
    -- если у него уже есть сохранённые значения
    start_param = COALESCE(leads.start_param, excluded.start_param),
    marketplace = COALESCE(leads.marketplace, excluded.marketplace),
    prize = COALESCE(leads.prize, excluded.prize)
`);

export function saveLead(lead: Lead): void {
  upsertStmt.run({
    telegramId: lead.telegramId,
    username: lead.username,
    firstName: lead.firstName,
    startParam: lead.startParam,
    marketplace: lead.marketplace,
    prize: lead.prize,
    now: new Date().toISOString(),
  });
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
  first_seen_at: string;
  last_seen_at: string;
}

export function getAllLeads(): LeadRow[] {
  return db
    .prepare(
      "SELECT telegram_id, username, first_name, start_param, marketplace, prize, first_seen_at, last_seen_at FROM leads ORDER BY first_seen_at DESC"
    )
    .all() as LeadRow[];
}
