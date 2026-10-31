"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import type { FormState } from "@/components/admin/action-form";

const fail = (message: string): FormState => ({ ok: false, message });
const ok = (message: string): FormState => ({ ok: true, message });

/** Turns database rule violations into messages a shop assistant can act on. */
function friendly(e: unknown): string {
  const msg = (e as Error)?.message ?? "Unexpected error";
  const rule = msg.match(/^(IMAGE REQUIRED|CLASSIFICATION REQUIRED|PRICE REQUIRED):\s*(.*)$/);
  if (rule) return `${rule[1]}: ${rule[2]}`;
  if (/products_sku_key|duplicate key.*sku/i.test(msg)) return "That SKU is already used by another product.";
  if (/oem_part_numbers_product_id_normalized_key/.test(msg)) return "That part number is already on this product.";
  if (/Insufficient stock/.test(msg)) return msg.replace(/^error:\s*/i, "");
  if (/violates foreign key.*order_items|inventory_movements/.test(msg)) return "This product has order or stock history and cannot be deleted.";
  return "Could not save: " + msg.slice(0, 160);
}

const optionalInt = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).max(2_000_000_000).optional());
const optionalNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).max(100000).optional());
const optionalUuid = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().uuid().optional());

const productSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2, "Enter a product name").max(200),
  sku: z.string().trim().max(60).optional(),
  description: z.string().trim().max(4000).optional(),
  categoryId: optionalUuid,
  brandId: optionalUuid,
  classification: z.enum(["unverified", "genuine_oem", "oem_equivalent", "aftermarket"]),
  condition: z.enum(["new", "used", "refurbished"]),
  priceTzs: z.coerce.number().int("Price must be a whole number of TZS").min(0).max(2_000_000_000),
  costPriceTzs: optionalInt,
  weightKg: optionalNum,
  status: z.enum(["draft", "published", "archived", "image_required"]),
});

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  let createdId: string | null = null;
  try {
    const result = await withDb(staffSession(me), async (db) => {
      if (d.id) {
        const before = (await db.query("select name, sku::text as sku, price_tzs, cost_price_tzs, status, classification, category_id from products where id = $1 for update", [d.id])).rows[0];
        if (!before) return fail("Product not found.");
        await db.query(
          `update products set name=$2, description=$3, category_id=$4, brand_id=$5, classification=$6, condition=$7,
                  price_tzs=$8, cost_price_tzs=$9, weight_kg=$10, status=$11 where id=$1`,
          [d.id, d.name, d.description || null, d.categoryId ?? null, d.brandId ?? null, d.classification, d.condition, d.priceTzs, d.costPriceTzs ?? null, d.weightKg ?? null, d.status],
        );
        await writeAudit(db, me, {
          action: "product.update",
          entityType: "product",
          entityId: d.id,
          before,
          after: { name: d.name, price_tzs: d.priceTzs, cost_price_tzs: d.costPriceTzs ?? null, status: d.status, classification: d.classification },
        });
        return ok("Saved.");
      }
      let sku = d.sku;
      if (!sku) {
        const n = (await db.query("select coalesce(max(substring(sku::text from 5)::int), 0) + 1 as n from products where sku::text ~ '^BAS-[0-9]+$'")).rows[0].n;
        sku = `BAS-${String(n).padStart(5, "0")}`;
      }
      let slug = slugify(`${d.name} ${sku}`);
      if ((await db.query("select 1 from products where slug = $1", [slug])).rowCount) slug = `${slug}-${Date.now().toString(36)}`;
      const res = await db.query(
        `insert into products (sku, slug, name, description, category_id, brand_id, classification, condition, price_tzs, cost_price_tzs, weight_kg, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
        [sku, slug, d.name, d.description || null, d.categoryId ?? null, d.brandId ?? null, d.classification, d.condition, d.priceTzs, d.costPriceTzs ?? null, d.weightKg ?? null, d.status],
      );
      createdId = res.rows[0].id as string;
      await writeAudit(db, me, { action: "product.create", entityType: "product", entityId: createdId, after: { sku, name: d.name, price_tzs: d.priceTzs } });
      return ok("Created.");
    });
    if (!result.ok) return result;
  } catch (e) {
    return fail(friendly(e));
  }
  revalidatePath("/admin/products");
  if (createdId) redirect(`/admin/products/${createdId}`);
  revalidatePath(`/admin/products/${d.id}`);
  return ok("Saved.");
}

const stockSchema = z.object({
  productId: z.string().uuid(),
  direction: z.enum(["add", "remove"]),
  quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Enter a quantity of 1 or more").max(1_000_000),
  reason: z.enum(["opening_stock", "purchase", "sale", "adjustment", "return", "damage", "correction"]),
  note: z.string().trim().max(300).optional(),
});

/** Every stock change is a recorded movement; quantity cannot be edited any other way. */
export async function adjustStock(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = stockSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { productId, direction, quantity, reason, note } = parsed.data;
  try {
    const after = await withDb(staffSession(me), async (db) => {
      const res = await db.query(
        "insert into inventory_movements (product_id, quantity_delta, reason, note, created_by) values ($1,$2,$3,$4,$5) returning quantity_after",
        [productId, direction === "add" ? quantity : -quantity, reason, note || null, me.id],
      );
      await writeAudit(db, me, { action: "stock.adjust", entityType: "product", entityId: productId, after: { delta: direction === "add" ? quantity : -quantity, reason } });
      return res.rows[0].quantity_after as number;
    });
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/admin/inventory");
    return ok(`Recorded. Quantity on hand is now ${after}.`);
  } catch (e) {
    return fail(friendly(e));
  }
}

export async function setMinStock(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z.object({ productId: z.string().uuid(), min: z.coerce.number().int().min(0).max(1_000_000), location: z.string().trim().max(80).optional() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Enter a whole number of 0 or more.");
  try {
    await withDb(staffSession(me), async (db) => {
      await db.query("update inventory set min_stock_level = $2, location = $3 where product_id = $1", [parsed.data.productId, parsed.data.min, parsed.data.location || null]);
      await writeAudit(db, me, { action: "stock.min_level", entityType: "product", entityId: parsed.data.productId, after: { min: parsed.data.min } });
    });
    revalidatePath(`/admin/products/${parsed.data.productId}`);
    return ok("Saved.");
  } catch (e) {
    return fail(friendly(e));
  }
}

export async function addPartNumber(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z.object({ productId: z.string().uuid(), partNumber: z.string().trim().min(3, "Enter a part number").max(80), kind: z.enum(["primary", "alternative"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { productId, partNumber, kind } = parsed.data;
  try {
    await withDb(staffSession(me), async (db) => {
      if (kind === "primary") await db.query("update oem_part_numbers set is_primary = false where product_id = $1", [productId]);
      await db.query("insert into oem_part_numbers (product_id, part_number, is_primary, is_alternative) values ($1,$2,$3,$4)", [productId, partNumber, kind === "primary", kind === "alternative"]);
      await writeAudit(db, me, { action: "part_number.add", entityType: "product", entityId: productId, after: { partNumber, kind } });
    });
    revalidatePath(`/admin/products/${productId}`);
    return ok("Part number added.");
  } catch (e) {
    return fail(friendly(e));
  }
}

export async function removePartNumber(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z.object({ id: z.string().uuid(), productId: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Invalid request.");
  await withDb(staffSession(me), async (db) => {
    await db.query("delete from oem_part_numbers where id = $1 and product_id = $2", [parsed.data.id, parsed.data.productId]);
    await writeAudit(db, me, { action: "part_number.remove", entityType: "product", entityId: parsed.data.productId, before: { id: parsed.data.id } });
  });
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return ok("Removed.");
}

const imageSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().trim().url("Enter a full image address").max(600).refine((u) => u.startsWith("https://"), "The image address must start with https://"),
  kind: z.enum(["own_photo", "manufacturer_photo", "supplier_photo", "illustrative"]),
  sourceName: z.string().trim().max(120).optional(),
  license: z.string().trim().max(160).optional(),
  attribution: z.string().trim().max(200).optional(),
  confirm: z.string().optional(),
});

/** Adds a photo. It is only approved when staff confirm it is a real photo of this exact part. */
export async function addImage(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = imageSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const approve = d.confirm === "yes" && d.kind !== "illustrative";
  try {
    await withDb(staffSession(me), async (db) => {
      const hasPrimary = (await db.query("select 1 from product_images where product_id = $1 and is_primary", [d.productId])).rowCount! > 0;
      const res = await db.query(
        `insert into product_images (product_id, storage_path, url, kind, is_primary, source_name, license, attribution, verification_status, verified_by, verified_at)
         values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [d.productId, d.url, d.kind, approve && !hasPrimary, d.sourceName || null, d.license || null, d.attribution || null, approve ? "approved" : "pending", approve ? me.id : null, approve ? new Date() : null],
      );
      await writeAudit(db, me, { action: approve ? "image.approve" : "image.add", entityType: "product", entityId: d.productId, after: { imageId: res.rows[0].id, kind: d.kind } });
    });
    revalidatePath(`/admin/products/${d.productId}`);
    return ok(approve ? "Photo added and approved." : "Photo added, waiting for approval.");
  } catch (e) {
    return fail(friendly(e));
  }
}

export async function setImageStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z.object({ id: z.string().uuid(), productId: z.string().uuid(), action: z.enum(["approve", "reject", "primary", "delete"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Invalid request.");
  const { id, productId, action } = parsed.data;
  try {
    await withDb(staffSession(me), async (db) => {
      if (action === "approve") {
        const hasPrimary = (await db.query("select 1 from product_images where product_id = $1 and is_primary and verification_status = 'approved'", [productId])).rowCount! > 0;
        await db.query("update product_images set verification_status='approved', verified_by=$3, verified_at=now(), is_primary = (not $4) where id=$1 and product_id=$2", [id, productId, me.id, hasPrimary]);
      } else if (action === "reject") {
        await db.query("update product_images set verification_status='rejected', is_primary=false, verified_by=$3, verified_at=now() where id=$1 and product_id=$2", [id, productId, me.id]);
      } else if (action === "primary") {
        await db.query("update product_images set is_primary=false where product_id=$1", [productId]);
        await db.query("update product_images set is_primary=true where id=$1 and product_id=$2 and verification_status='approved'", [id, productId]);
      } else {
        await db.query("delete from product_images where id=$1 and product_id=$2", [id, productId]);
      }
      await writeAudit(db, me, { action: `image.${action}`, entityType: "product", entityId: productId, after: { imageId: id } });
    });
    revalidatePath(`/admin/products/${productId}`);
    return ok("Done.");
  } catch (e) {
    return fail(friendly(e));
  }
}

/** Deletes a product that has no history; otherwise archives it so history is kept. */
export async function removeProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return fail("Invalid request.");
  let archivedOnly = false;
  try {
    await withDb(staffSession(me), async (db) => {
      const hist = await db.query(
        "select (select count(*) from order_items where product_id=$1) + (select count(*) from inventory_movements where product_id=$1 and reason <> 'import' and reason <> 'opening_stock') as n",
        [id.data],
      );
      if (Number(hist.rows[0].n) > 0) {
        await db.query("update products set status='archived' where id=$1", [id.data]);
        archivedOnly = true;
        await writeAudit(db, me, { action: "product.archive", entityType: "product", entityId: id.data });
      } else {
        await db.query("savepoint s");
        try {
          await db.query("delete from products where id=$1", [id.data]);
        } catch {
          await db.query("rollback to savepoint s");
          await db.query("update products set status='archived' where id=$1", [id.data]);
          archivedOnly = true;
        }
        await writeAudit(db, me, { action: archivedOnly ? "product.archive" : "product.delete", entityType: "product", entityId: id.data });
      }
    });
  } catch (e) {
    return fail(friendly(e));
  }
  revalidatePath("/admin/products");
  if (archivedOnly) return ok("This product has stock history, so it was archived instead of deleted.");
  redirect("/admin/products");
}
