// Generates AI reference images (owner decision 2026-10-31) for products that have no image yet, crops each
// tightly to the part, saves public/products/<sku>.webp and records it as an approved 'illustrative' image.
//   node --env-file=.env.local scripts/generate-product-images.mjs <limit> [--home] [--dry-run]
// --home: the products shown on the home page (newest published). --stock: most units in stock first
// (no orders exist yet, so stock is the stand-in for "best selling"). Default: by SKU. Needs CLOUDFLARE_* in .env.local.
import fs from "node:fs";
import pg from "pg";
import sharp from "sharp";

const limit = Number(process.argv[2] ?? 4);
const home = process.argv.includes("--home");
const stock = process.argv.includes("--stock");
const dry = process.argv.includes("--dry-run");
const { CLOUDFLARE_ACCOUNT_ID: acct, CLOUDFLARE_API_TOKEN: token, DATABASE_URL_UNPOOLED, DATABASE_URL } = process.env;
if (!acct || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN missing");

const db = new pg.Client({ connectionString: DATABASE_URL_UNPOOLED ?? DATABASE_URL });
await db.connect();
const { rows } = await db.query(
  `select p.id, p.sku, p.name from products p left join inventory inv on inv.product_id = p.id
   where p.status = 'published' and not exists (select 1 from product_images i where i.product_id = p.id)
   order by ${home ? "p.created_at desc" : stock ? "coalesce(inv.quantity_on_hand, 0) desc, p.sku" : "p.sku"} limit $1`,
  [limit],
);
fs.mkdirSync("public/products", { recursive: true });

for (const p of rows) {
  const prompt = `close-up professional studio product photo of a new ${p.name.toLowerCase()} car part, the single part fills most of the frame, centered on plain pure white background, soft shadow, sharp focus, realistic, no text, no logo`;
  if (dry) { console.log(p.sku, p.name); continue; }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ prompt, steps: 6 }),
  });
  const j = await res.json();
  if (!j.result?.image) {
    const msg = JSON.stringify(j.errors);
    console.log(p.sku, p.name, "FAILED", msg);
    // Daily free allowance used up (or rate limited): stop; re-run later, finished products are skipped.
    if (res.status === 429 || /allocation|quota|limit/i.test(msg)) { console.log("Stopping: free limit reached."); break; }
    continue;
  }
  const raw = Buffer.from(j.result.image, "base64");
  // Trim the empty background, then centre the part so it fills ~85% of a square white frame.
  const trimmed = await sharp(raw).trim({ background: "#ffffff", threshold: 22 }).resize(680, 680, { fit: "inside" }).toBuffer();
  const file = `public/products/${p.sku.toLowerCase()}.webp`;
  await sharp(trimmed).resize(800, 800, { fit: "contain", background: "#ffffff" }).webp({ quality: 82 }).toFile(file);
  const url = `/${file.replace("public/", "")}`;
  await db.query(
    "insert into product_images (product_id, storage_path, url, kind, is_primary, source_name, verification_status) values ($1,$2,$2,'illustrative',true,'AI reference image (Cloudflare FLUX.1 schnell)','approved')",
    [p.id, url],
  );
  console.log(p.sku, p.name, "ok", fs.statSync(file).size, "bytes");
}
await db.end();
