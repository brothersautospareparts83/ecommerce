// ONE-OFF (2026-10-31): the second table on the "store 3" sheet has B/PRICE and S/PRICE columns, which the first
// import read as a single price column. Re-reads the file and corrects only the products still in the state that
// mistake produced (nothing edited by staff is touched).
//   Preview: npx tsx scripts/fix-store3-second-table.mts <file.xlsx> --dry-run
//   Apply:   npx tsx --env-file=.env.local scripts/fix-store3-second-table.mts <file.xlsx>
import pg from "pg";
import { buildDrafts, readWorkbook } from "../src/lib/import/parse.ts";

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
const dry = process.argv.includes("--dry-run");
if (!file) throw new Error("Usage: tsx scripts/fix-store3-second-table.mts <file.xlsx> [--dry-run]");
const { rows } = await readWorkbook(file);
const { drafts } = buildDrafts(rows);
const targets = drafts.filter((d) => d.buyPriceTzs && d.sources.length > 0 && d.sources.every((s) => s.sheet === "store 3"));

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
await db.connect();
const keys = targets.map((d) => d.key);
const cur = await db.query("select import_key, price_tzs::bigint p, cost_price_tzs::bigint c from products where import_key = any($1)", [keys]);
const byKey = new Map(cur.rows.map((r) => [r.import_key as string, { p: Number(r.p), c: r.c == null ? null : Number(r.c) }]));
const fixes = targets.filter((d) => {
  const c = byKey.get(d.key);
  if (!c) return false;
  const stateAfterMyUpdate = c.p === d.buyPriceTzs && c.c === null; // price was set from the buying price
  const stateAfterImport = c.p === 0 && c.c === d.buyPriceTzs;      // untouched since import
  return (stateAfterMyUpdate || stateAfterImport) && (d.sellPriceTzs ?? 0) !== c.p;
});
console.log(`store-3-only products with a buying price: ${targets.length}; to correct: ${fixes.length}; with a real selling price among them: ${fixes.filter((d) => d.sellPriceTzs > 0).length}`);
if (!dry && fixes.length) {
  await db.query("begin");
  const res = await db.query(
    "update products p set price_tzs = x.sell, cost_price_tzs = x.buy from unnest($1::text[], $2::bigint[], $3::bigint[]) as x(key, sell, buy) where p.import_key = x.key",
    [fixes.map((d) => d.key), fixes.map((d) => d.sellPriceTzs || 0), fixes.map((d) => d.buyPriceTzs)],
  );
  await db.query("insert into audit_logs (actor_role, action, entity_type, after_data) values ('system','products.fix_store3_second_table','product',$1)", [JSON.stringify({ changed: res.rowCount })]);
  await db.query("commit");
  console.log(`Corrected ${res.rowCount} products.`);
}
await db.end();
