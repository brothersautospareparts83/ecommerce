"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import type { FormState } from "@/components/admin/action-form";

const fail = (message: string): FormState => ({ ok: false, message });

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const p = z.object({
    id: z.string().uuid(),
    nameEn: z.string().trim().min(2, "Enter a category name").max(80),
    nameSw: z.string().trim().max(80).optional(),
    sortOrder: z.coerce.number().int().min(0).max(1000),
    active: z.string().optional(),
  }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail(p.error.issues[0].message);
  await withDb(staffSession(me), async (db) => {
    await db.query("update categories set name_en=$2, name_sw=$3, sort_order=$4, is_active=$5 where id=$1", [p.data.id, p.data.nameEn, p.data.nameSw || null, p.data.sortOrder, p.data.active === "on"]);
    await writeAudit(db, me, { action: "category.update", entityType: "category", entityId: p.data.id, after: p.data });
  });
  revalidatePath("/admin/catalog");
  revalidatePath("/categories");
  return { ok: true, message: "Saved." };
}

export async function addBrand(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const p = z.object({ name: z.string().trim().min(2, "Enter a brand name").max(80), country: z.string().trim().max(60).optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail(p.error.issues[0].message);
  try {
    await withDb(staffSession(me), async (db) => {
      const r = await db.query("insert into brands (name, slug, country) values ($1, $2, $3) returning id", [p.data.name, slugify(p.data.name), p.data.country || null]);
      await writeAudit(db, me, { action: "brand.create", entityType: "brand", entityId: r.rows[0].id, after: p.data });
    });
  } catch (e) {
    return fail(/duplicate key/.test((e as Error).message) ? "That brand already exists." : "Could not add the brand.");
  }
  revalidatePath("/admin/catalog");
  return { ok: true, message: "Brand added." };
}

export async function saveBrand(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const p = z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(80), active: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail("Enter a brand name.");
  try {
    await withDb(staffSession(me), async (db) => {
      await db.query("update brands set name=$2, is_active=$3 where id=$1", [p.data.id, p.data.name, p.data.active === "on"]);
      await writeAudit(db, me, { action: "brand.update", entityType: "brand", entityId: p.data.id, after: p.data });
    });
  } catch {
    return fail("Could not save (is the name already used?).");
  }
  revalidatePath("/admin/catalog");
  return { ok: true, message: "Saved." };
}
