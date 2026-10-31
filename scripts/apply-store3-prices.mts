// ONE-OFF (already applied 2026-10-31): relies on the old "price column is headed" import note, which no longer exists.
// Owner decision: the store 3 "PRICE RMB" column is the SELLING price. Applies it to products that still have
// no selling price, and clears the cost that was wrongly read from it.
//   Preview: npx tsx scripts/apply-store3-prices.mts <file.xlsx> --dry-run
//   Apply:   npx tsx --env-file=.env.local scripts/apply-store3-prices.mts <file.xlsx>
import pg from "pg";
import { buildDrafts, readWorkbook } from "../src/lib/import/parse.ts";

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry-run");
if (!file) throw new Error("Usage: tsx scripts/apply-store3-prices.mts <file.xlsx> [--dry-run]");

const { sheets, rows } = await readWorkbook(file);
const rmbSheets = new Set(sheets.filter((s) => s.assumptions.some((a) => a.includes("price column is headed"))).map((s) => s.name));
const { drafts } = buildDrafts(rows);
const targets = drafts.filter((d) => !d.sellPriceTzs && d.buyPriceTzs && d.sources.length > 0 && d.sources.every((s) => rmbSheets.has(s.sheet)));
console.log(`RMB-price sheets: ${[...rmbSheets].join(", ")}   candidates: ${targets.length}`);
if (dry) process.exit(0);

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
await db.connect();
await db.query("begin");
const res = await db.query(
  "update products p set price_tzs = x.price, cost_price_tzs = null from unnest($1::text[], $2::bigint[]) as x(key, price) where p.import_key = x.key and p.price_tzs = 0 and p.cost_price_tzs = x.price",
  [targets.map((d) => d.key), targets.map((d) => d.buyPriceTzs)],
);
const changed = res.rowCount ?? 0;
await db.query("insert into audit_logs (actor_role, action, entity_type, after_data) values ('system','products.store3_prices_as_selling','product',$1)", [JSON.stringify({ changed, reason: "owner decision: store 3 price column is the selling price" })]);
await db.query("commit");
const left = await db.query("select count(*) filter (where price_tzs = 0)::int unpriced from products");
console.log(`Updated ${changed} products. Still without a selling price: ${left.rows[0].unpriced}`);
await db.end();
