#!/usr/bin/env node
/**
 * Seeds deterministic historical orders so the analytics can be checked
 * against hand-computed totals. Writes straight to Postgres because the API
 * stamps CreatedAt as now, and emits one SQL script rather than a psql
 * process per row.
 *
 * DESTRUCTIVE: clears every existing order first. The assertion is that the
 * API's aggregates equal totals computed here independently, which only holds
 * if the seeded rows are the only rows — orders left behind by other tests
 * would otherwise be counted by the API and not by the expectation.
 * Development fixture only.
 */
import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import { promisify } from "node:util";
const run = promisify(execFile);

const DAYS = 14;
const PATTERN = [3, 5, 4, 6, 8, 12, 9];   // orders per day, indexed by UTC day-of-week
const SLUGS = ["bardak-cay", "cheesecake", "sini-kahvalti"];

const rows = [];
let orders = 0, revenue = 0, units = 0;
const perSlug = Object.fromEntries(SLUGS.map((s) => [s, { qty: 0, revenue: 0 }]));
const PRICE = { "bardak-cay": 4000, cheesecake: 26000, "sini-kahvalti": 110000 };

for (let d = DAYS - 1; d >= 0; d--) {
  const day = new Date(Date.now() - d * 86400000);
  for (let n = 0; n < PATTERN[day.getUTCDay()]; n++) {
    const at = new Date(day);
    at.setUTCHours(9 + ((n * 3) % 12), (n * 7) % 60, 0, 0);
    const slug = SLUGS[n % SLUGS.length];
    const qty = 1 + (n % 3);
    const total = PRICE[slug] * qty;
    orders++; revenue += total; units += qty;
    perSlug[slug].qty += qty; perSlug[slug].revenue += total;
    rows.push({ at: at.toISOString(), slug, qty, unit: PRICE[slug], total, key: `hist-${d}-${n}` });
  }
}

const sql = `
BEGIN;
DELETE FROM order_status_events;
DELETE FROM order_items;
DELETE FROM orders;

${rows.map((r) => `
WITH t AS (SELECT "Id" FROM tables WHERE "Number"='3'),
     m AS (SELECT "Id","PriceMinor",name_tr,name_en FROM menu_items WHERE "Slug"='${r.slug}'),
     o AS (
       INSERT INTO orders ("Id","OrderNumber","CafeTableId","Status","Locale",
                           "SubtotalMinor","TotalMinor","ClientRequestId","CreatedAt","UpdatedAt")
       SELECT gen_random_uuid(), left(md5('${r.key}'),8), t."Id", 'Paid', 'tr',
              ${r.total}, ${r.total}, '${r.key}', '${r.at}'::timestamptz, '${r.at}'::timestamptz
       FROM t RETURNING "Id"
     )
INSERT INTO order_items ("Id","OrderId","MenuItemId",name_tr,name_en,
                         "UnitPriceMinor","Quantity","SelectedOptionsJson","LineTotalMinor")
SELECT gen_random_uuid(), o."Id", m."Id", m.name_tr, m.name_en,
       ${r.unit}, ${r.qty}, '[]', ${r.total} FROM o, m;`).join("\n")}
COMMIT;
`;

writeFileSync("/tmp/history.sql", sql);
await run("psql", ["-h", "127.0.0.1", "-U", "mist", "-d", "mist", "-q", "-f", "/tmp/history.sql"],
          { env: { ...process.env, PGPASSWORD: "mist" } });

const expected = {
  orderCount: orders,
  revenueMinor: revenue,
  itemsSold: units,
  averageTicketMinor: Math.trunc(revenue / orders),
  topBySlug: Object.entries(perSlug)
    .sort((a, b) => b[1].qty - a[1].qty)
    .map(([slug, v]) => ({ slug, ...v })),
};
writeFileSync("/tmp/expected-analytics.json", JSON.stringify(expected, null, 2));
console.log("seeded", orders, "orders across", DAYS, "days");
console.log(JSON.stringify(expected, null, 2));
