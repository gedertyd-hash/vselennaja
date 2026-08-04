import type { LeadRow } from "./db.js";
import { marketplaceLabel } from "./marketplaces.js";

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function leadsToCsv(rows: LeadRow[]): string {
  const header = [
    "telegram_id",
    "username",
    "first_name",
    "marketplace",
    "start_param",
    "prize",
    "first_seen_at",
    "last_seen_at",
  ];

  const lines = rows.map((row) =>
    [
      String(row.telegram_id),
      row.username ?? "",
      row.first_name ?? "",
      marketplaceLabel(row.marketplace),
      row.start_param ?? "",
      row.prize ?? "",
      row.first_seen_at,
      row.last_seen_at,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  // BOM в начале — чтобы Excel сразу правильно показал кириллицу.
  return "﻿" + [header.join(","), ...lines].join("\n");
}
