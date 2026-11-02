// Applies the Base44-generated reference images (one per part name, from the PartImageMaker records of the
// Woodland Auto Parts Base44 app) to every product with that name. Replaces the earlier Cloudflare images; products
// with a real (non-illustrative) photo are left alone. Owner decision 2026-10-31.
//   node --env-file=.env.local scripts/apply-base44-images.mjs <records.json> [--dry-run] [--only-missing]
// --only-missing: only products with no image at all (keeps existing AI images as they are).
// <records.json>: the PartImageMaker records exported from Base44 ({entities:[{part_name,image_url}]} or a bare array).
import fs from "node:fs";
import pg from "pg";
import sharp from "sharp";

const dry = process.argv.includes("--dry-run");
const onlyMissing = process.argv.includes("--only-missing");
const SOURCE = "AI reference image (Base44)";

const file0 = process.argv.slice(2).find((x) => !x.startsWith("--"));
if (!file0) throw new Error("Usage: apply-base44-images.mjs <records.json> [--dry-run]");
const raw0 = JSON.parse(fs.readFileSync(file0, "utf8"));
const records = Array.isArray(raw0) ? raw0 : raw0.entities;
const urlByName = new Map(records.filter((r) => r.part_name && r.image_url).map((r) => [r.part_name.toLowerCase().trim(), r.image_url]));
console.log(`Base44 images: ${urlByName.size} part names`);

const db = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL });
await db.connect();
fs.mkdirSync("public/products/type", { recursive: true });
let products = 0, replaced = 0;
for (const [name, remote] of urlByName) {
  const { rows } = await db.query(
    `select p.id from products p where p.status = 'published' and lower(trim(p.name)) = $1
       and not exists (select 1 from product_images i where i.product_id = p.id ${onlyMissing ? "" : "and i.kind <> 'illustrative'"})`,
    [name],
  );
  if (!rows.length) continue;
  const slug = name.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "part";
  const file = `public/products/type/${slug}.webp`;
  const url = `/products/type/${slug}.webp`;
  if (dry) { console.log(name, rows.length, "products"); continue; }
  if (!fs.existsSync(file)) {
    const img = Buffer.from(await (await fetch(remote)).arrayBuffer());
    await sharp(img).resize(800, 800, { fit: "contain", background: "#ffffff" }).webp({ quality: 82 }).toFile(file);
  }
  const ids = rows.map((r) => r.id);
  await db.query("begin");
  const del = await db.query("delete from product_images where product_id = any($1) and kind = 'illustrative'", [ids]);
  replaced += del.rowCount ?? 0;
  await db.query(
    `insert into product_images (product_id, storage_path, url, kind, is_primary, source_name, verification_status)
     select unnest($1::uuid[]), $2, $2, 'illustrative', true, $3, 'approved'`,
    [ids, url, SOURCE],
  );
  await db.query("commit");
  products += ids.length;
}
// Remove Cloudflare files no row points to any more.
if (!dry) {
  const used = new Set((await db.query("select url from product_images")).rows.map((r) => r.url));
  for (const f of fs.readdirSync("public/products")) if (f.endsWith(".webp") && !used.has(`/products/${f}`)) fs.unlinkSync(`public/products/${f}`);
}
console.log(`${dry ? "Would update" : "Updated"} ${products} products (replaced ${replaced} older AI images).`);
await db.end();
