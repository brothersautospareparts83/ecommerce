// Imports the owner's stock spreadsheet into the catalog.
//   Dry run (reads the file, writes nothing):  npx tsx scripts/import-products.ts <file.xlsx> --dry-run
//   Import (adds NEW products only):           npx tsx --env-file=.env.local scripts/import-products.ts <file.xlsx>
// Existing products are never overwritten. Buying prices and quantities stay admin-only.
import { mkdir, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import pg from "pg";
import { buildDrafts, describeDraft, readWorkbook } from "../src/lib/import/parse.ts";
import { slugify } from "../src/lib/slug.ts";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry-run");
if (!file) {
  console.error("Usage: tsx scripts/import-products.ts <file.xlsx> [--dry-run]");
  process.exit(1);
}

const { sheets, rows } = await readWorkbook(file);
const { drafts, rejected } = buildDrafts(rows);

// ---- report ---------------------------------------------------------------------------
console.log(`\nFile: ${basename(file)}`);
for (const s of sheets) {
  console.log(`\n  Sheet "${s.name}": header row ${s.headerRow ?? "-"}, ${s.rowsRead} data rows`);
  for (const [k, v] of Object.entries(s.columns)) console.log(`    ${k.padEnd(12)} <- ${v}`);
  for (const a of s.assumptions) console.log(`    NOTE: ${a}`);
}
const count = (code: string) => drafts.filter((d) => d.warnings.some((w) => w.code === code)).length;
const withStock = drafts.filter((d) => d.sources.some((s) => s.qty > 0)).length;
console.log(`\nRows read: ${rows.length}   Rejected: ${rejected.length}   Products after merging duplicates: ${drafts.length}`);
console.log(`With stock: ${withStock}   With selling price: ${drafts.filter((d) => d.sellPriceTzs > 0).length}   With buying price: ${drafts.filter((d) => d.buyPriceTzs).length}   With part number: ${drafts.filter((d) => d.partNumber).length}`);
for (const code of ["price_missing", "no_part_number", "category_missing", "category_unmapped", "qty_unreadable", "qty_invalid", "buy_above_sell", "duplicate_merged", "price_conflict", "cost_conflict"]) {
  console.log(`  ${code.padEnd(18)} ${count(code)}`);
}
const cats = new Map<string, number>();
for (const d of drafts) cats.set(d.categoryRaw ? `${d.categoryRaw} -> ${d.categorySlug ?? "UNMAPPED"}` : "(none)", (cats.get(d.categoryRaw ? `${d.categoryRaw} -> ${d.categorySlug ?? "UNMAPPED"}` : "(none)") ?? 0) + 1);
console.log("\nCategories:");
for (const [k, v] of [...cats].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);

// report file (contains buying prices: stays local, git-ignored)
await mkdir("imports", { recursive: true });
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const lines = ["sheet,row,name,part_number,selling_price,buying_price,total_qty,category,warnings"];
for (const d of drafts) {
  lines.push([d.sources[0].sheet, d.sources[0].rowNumber, d.name, d.partNumber ?? d.supplierReference ?? "", d.sellPriceTzs, d.buyPriceTzs ?? "", d.sources.reduce((a, s) => a + s.qty, 0), d.categoryRaw, d.warnings.map((w) => w.message).join(" | ")].map(esc).join(","));
}
for (const r of rejected) lines.push([r.row.sheet, r.row.rowNumber, r.row.description, r.row.partRaw, "", "", "", "", `REJECTED: ${r.reason}`].map(esc).join(","));
const reportPath = `imports/report-${dry ? "dry-run" : "import"}-${new Date().toISOString().slice(0, 10)}.csv`;
await writeFile(reportPath, "﻿" + lines.join("\n"));
console.log(`\nReport written to ${reportPath}`);

if (dry) {
  console.log("\nDry run: nothing was written to the database.");
  process.exit(0);
}

// ---- import ---------------------------------------------------------------------------
// Rows are sent in batches (one statement per ~200 products) because every round trip to the
// hosted database is slow; the whole import is a single transaction, so it is all-or-nothing.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set");
const db = new pg.Client({ connectionString: url });
await db.connect();
const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
try {
  await db.query("begin");
  const job = (
    await db.query(
      "insert into import_jobs (file_name, mode, status, total_rows) values ($1, 'add_new', 'processing', $2) returning id",
      [basename(file), rows.length],
    )
  ).rows[0].id as string;

  const catIds = new Map<string, string>((await db.query("select slug, id from categories")).rows.map((r) => [r.slug, r.id]));
  const existingKeys = new Set((await db.query("select import_key from products where import_key is not null")).rows.map((r) => r.import_key as string));
  let next = Number((await db.query("select coalesce(max(substring(sku::text from 5)::int), 0) as n from products where sku::text ~ '^BAS-[0-9]+$'")).rows[0].n);
  const slugs = new Set((await db.query("select slug from products")).rows.map((r) => r.slug as string));

  const fresh = drafts.filter((d) => !existingKeys.has(d.key));
  const skippedExisting = drafts.length - fresh.length;
  const prepared = fresh.map((d) => {
    next++;
    const sku = `BAS-${String(next).padStart(5, "0")}`;
    let slug = slugify(`${d.name} ${d.partNumber ?? ""}`) || slugify(sku);
    if (slugs.has(slug)) slug = `${slug}-${sku.toLowerCase()}`;
    slugs.add(slug);
    return { d, sku, slug };
  });

  const idByKey = new Map<string, string>();
  for (const part of chunk(prepared, 200)) {
    const payload = part.map(({ d, sku, slug }) => ({
      sku, slug, name: d.name, description: describeDraft(d), category_id: d.categorySlug ? catIds.get(d.categorySlug) ?? null : null,
      price: d.sellPriceTzs, cost: d.buyPriceTzs, key: d.key,
    }));
    // Not published: no verified photo yet, and price / type may still need review.
    const res = await db.query(
      `insert into products (sku, slug, name, description, category_id, classification, condition, price_tzs, cost_price_tzs, status, import_key)
       select x.sku, x.slug, x.name, x.description, x.category_id, 'unverified', 'new', x.price, x.cost, 'draft', x.key
       from jsonb_to_recordset($1::jsonb) as x(sku text, slug text, name text, description text, category_id uuid, price bigint, cost bigint, key text)
       returning id, import_key`,
      [JSON.stringify(payload)],
    );
    for (const r of res.rows) idByKey.set(r.import_key as string, r.id as string);
  }

  const oem = prepared.filter(({ d }) => d.partNumber).map(({ d }) => ({ product_id: idByKey.get(d.key), part_number: d.partNumber }));
  for (const part of chunk(oem, 400)) {
    await db.query(
      `insert into oem_part_numbers (product_id, part_number, is_primary)
       select x.product_id, x.part_number, true from jsonb_to_recordset($1::jsonb) as x(product_id uuid, part_number text)
       on conflict (product_id, normalized) do nothing`,
      [JSON.stringify(part)],
    );
  }

  const moves = prepared.flatMap(({ d }) =>
    d.sources.filter((s) => s.qty > 0).map((s) => ({
      product_id: idByKey.get(d.key), qty: s.qty, note: `Opening stock from ${basename(file)} / ${s.sheet} row ${s.rowNumber} (${s.store})`,
    })),
  );
  for (const part of chunk(moves, 300)) {
    await db.query(
      `insert into inventory_movements (product_id, quantity_delta, reason, reference_type, reference_id, note)
       select x.product_id, x.qty, 'import', 'import_job', $2::uuid, x.note
       from jsonb_to_recordset($1::jsonb) as x(product_id uuid, qty int, note text)`,
      [JSON.stringify(part), job],
    );
  }

  // Row-level record of what happened (import history and audit).
  const rowsLog = drafts.map((d, i) => {
    const imported = !existingKeys.has(d.key);
    return {
      n: i + 1,
      raw: { sheet: d.sources[0].sheet, row: d.sources[0].rowNumber, key: d.key },
      normalized: { name: d.name, partNumber: d.partNumber, sellPriceTzs: d.sellPriceTzs, sourceRows: d.sources.length },
      status: imported ? "imported" : "duplicate",
      errors: d.warnings,
      product_id: idByKey.get(d.key) ?? null,
      action: imported ? "created" : "skipped_existing",
    };
  });
  for (const part of chunk(rowsLog, 300)) {
    await db.query(
      `insert into import_job_rows (job_id, row_number, raw, normalized, status, errors, matched_product_id, action)
       select $2::uuid, x.n, x.raw, x.normalized, x.status::import_row_status, x.errors, x.product_id, x.action
       from jsonb_to_recordset($1::jsonb) as x(n int, raw jsonb, normalized jsonb, status text, errors jsonb, product_id uuid, action text)`,
      [JSON.stringify(part), job],
    );
  }

  await db.query(
    "update import_jobs set status='completed', completed_at=now(), valid_rows=$2, invalid_rows=$3, duplicate_rows=$4, imported_rows=$5 where id=$1",
    [job, drafts.length, rejected.length, skippedExisting, prepared.length],
  );
  await db.query(
    "insert into audit_logs (actor_role, action, entity_type, entity_id, after_data) values ('database-owner', 'import.products', 'import_job', $1, $2)",
    [job, JSON.stringify({ file: basename(file), created: prepared.length, skippedExisting, stockMovements: moves.length, rejected: rejected.length })],
  );
  await db.query("commit");
  console.log(`\nImported: ${prepared.length} new products, ${moves.length} opening-stock movements, ${skippedExisting} already existed (skipped), ${rejected.length} rejected rows. Job ${job}`);
} catch (e) {
  await db.query("rollback");
  console.error("\nImport FAILED and was rolled back:", (e as Error).message);
  process.exitCode = 1;
} finally {
  await db.end();
}