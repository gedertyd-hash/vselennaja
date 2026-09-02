// Быстрый просмотр базы из терминала: npm run stats
import { countByMarketplace, countLeads } from "./db.js";
import { marketplaceLabel } from "./marketplaces.js";

console.log(`Всего подписчиков в базе: ${countLeads()}`);
console.log("По маркетплейсам:");
for (const row of countByMarketplace()) {
  console.log(`  ${marketplaceLabel(row.marketplace)}: ${row.n}`);
}
