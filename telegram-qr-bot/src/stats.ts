// Быстрый просмотр базы из терминала: npm run stats
import { countByBatch, countLeads } from "./db.js";

console.log(`Всего подписчиков в базе: ${countLeads()}`);
console.log("По партиям/QR-кодам:");
for (const row of countByBatch()) {
  console.log(`  ${row.start_param ?? "(без метки)"}: ${row.n}`);
}
