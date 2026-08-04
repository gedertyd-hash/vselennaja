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
    prize TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    UNIQUE(telegram_id)
  );
`);

export interface Lead {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  startParam: string | null;
  prize: string | null;
}

const upsertStmt = db.prepare(`
  INSERT INTO leads (telegram_id, username, first_name, start_param, prize, first_seen_at, last_seen_at)
  VALUES (@telegramId, @username, @firstName, @startParam, @prize, @now, @now)
  ON CONFLICT(telegram_id) DO UPDATE SET
    username = excluded.username,
    first_name = excluded.first_name,
    last_seen_at = excluded.last_seen_at,
    -- не затираем партию/приз повторным сканированием другого QR тем же человеком,
    -- если у него уже есть сохранённые значения
    start_param = COALESCE(leads.start_param, excluded.start_param),
    prize = COALESCE(leads.prize, excluded.prize)
`);

export function saveLead(lead: Lead): void {
  upsertStmt.run({
    telegramId: lead.telegramId,
    username: lead.username,
    firstName: lead.firstName,
    startParam: lead.startParam,
    prize: lead.prize,
    now: new Date().toISOString(),
  });
}

export function countLeads(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM leads").get() as { n: number }).n;
}

export function countByBatch(): Array<{ start_param: string | null; n: number }> {
  return db
    .prepare(
      "SELECT start_param, COUNT(*) AS n FROM leads GROUP BY start_param ORDER BY n DESC"
    )
    .all() as Array<{ start_param: string | null; n: number }>;
}
