"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { FormState } from "@/components/admin/action-form";

const fail = (message: string): FormState => ({ ok: false, message });
const ok = (message: string): FormState => ({ ok: true, message });

const STATUSES = ["pending", "confirmed", "processing", "ready_for_pickup", "shipped", "delivered", "cancelled"] as const;
/** Statuses where goods leave the shop: the customer must have approved a real photo of their exact part first. */
const NEEDS_APPROVED_PHOTO = new Set(["ready_for_pickup", "shipped", "delivered"]);
const DEDUCTS_STOCK = new Set(["confirmed", "processing", "ready_for_pickup", "shipped", "delivered"]);

function friendly(e: unknown): string {
  const msg = (e as Error)?.message ?? "Unexpected error";
  if (/Insufficient stock/.test(msg)) return msg.replace(/^error:\s*/i, "");
  return "Could not save: " + msg.slice(0, 160);
}

/**
 * Moves an order to a new status. Stock is deducted (a recorded movement per line) the first time the order is
 * confirmed, and returned if it is cancelled afterwards.
 */
export async function setOrderStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z.object({ orderId: z.string().uuid(), status: z.enum(STATUSES) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Invalid request.");
  const { orderId, status } = parsed.data;
  try {
    const message = await withDb(staffSession(me), async (db) => {
      const o = (await db.query("select status, stock_deducted from orders where id = $1 for update", [orderId])).rows[0];
      if (!o) return "Order not found.";
      if (o.status === status) return "The order already has that status.";
      if (NEEDS_APPROVED_PHOTO.has(status)) {
        const latest = (await db.query("select status from order_photo_checks where order_id = $1 order by created_at desc limit 1", [orderId])).rows[0];
        if (latest?.status !== "approved") return "PHOTO: the customer must approve a photo of their exact part before this step. Add a photo below and wait for approval.";
      }
      const items = (await db.query("select product_id, quantity from order_items where order_id = $1", [orderId])).rows;
      if (DEDUCTS_STOCK.has(status) && !o.stock_deducted) {
        for (const it of items) {
          await db.query(
            "insert into inventory_movements (product_id, quantity_delta, reason, reference_type, reference_id, note, created_by) values ($1,$2,'sale','order',$3,$4,$5)",
            [it.product_id, -it.quantity, orderId, "Order confirmed", me.id],
          );
        }
        await db.query("update orders set stock_deducted = true where id = $1", [orderId]);
      } else if (status === "cancelled" && o.stock_deducted) {
        for (const it of items) {
          await db.query(
            "insert into inventory_movements (product_id, quantity_delta, reason, reference_type, reference_id, note, created_by) values ($1,$2,'return','order',$3,$4,$5)",
            [it.product_id, it.quantity, orderId, "Order cancelled", me.id],
          );
        }
        await db.query("update orders set stock_deducted = false where id = $1", [orderId]);
      }
      await db.query("update orders set status = $2 where id = $1", [orderId, status]);
      await writeAudit(db, me, { action: "order.status", entityType: "order", entityId: orderId, after: { from: o.status, to: status } });
      return null;
    });
    if (message) return fail(message.replace(/^PHOTO: /, ""));
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return ok("Status updated.");
  } catch (e) {
    return fail(friendly(e));
  }
}

export async function setDeliveryFee(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z.object({ orderId: z.string().uuid(), fee: z.coerce.number().int().min(0).max(100_000_000) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Enter the delivery fee as a whole number of TSh.");
  const { orderId, fee } = parsed.data;
  try {
    await withDb(staffSession(me), async (db) => {
      await db.query("update orders set delivery_fee_tzs = $2, total_tzs = subtotal_tzs - discount_tzs + $2 where id = $1", [orderId, fee]);
      await writeAudit(db, me, { action: "order.delivery_fee", entityType: "order", entityId: orderId, after: { fee } });
    });
    revalidatePath(`/admin/orders/${orderId}`);
    return ok("Delivery fee saved.");
  } catch (e) {
    return fail(friendly(e));
  }
}

/** Staff attach a real photo of the exact part for the customer to approve. */
export async function addPhotoCheck(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z
    .object({
      orderId: z.string().uuid(),
      imageUrl: z.string().trim().url("Enter the full photo address").max(600).refine((u) => u.startsWith("https://"), "The photo address must start with https://"),
      note: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { orderId, imageUrl, note } = parsed.data;
  try {
    await withDb(staffSession(me), async (db) => {
      await db.query("insert into order_photo_checks (order_id, image_url, note, created_by) values ($1,$2,$3,$4)", [orderId, imageUrl, note || null, me.id]);
      await writeAudit(db, me, { action: "order.photo_sent", entityType: "order", entityId: orderId, after: { imageUrl } });
    });
    revalidatePath(`/admin/orders/${orderId}`);
    return ok("Photo added. Send the customer their tracking link so they can approve it.");
  } catch (e) {
    return fail(friendly(e));
  }
}

/** Records money received. "Paid" needs a verifier, so this is always a person confirming it. */
export async function markPaid(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const parsed = z
    .object({
      orderId: z.string().uuid(),
      method: z.enum(["cash", "mobile_money", "bank_transfer"]),
      reference: z.string().trim().max(80).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fail("Invalid request.");
  const { orderId, method, reference } = parsed.data;
  try {
    const msg = await withDb(staffSession(me), async (db) => {
      const o = (await db.query("select total_tzs, payment_status from orders where id = $1 for update", [orderId])).rows[0];
      if (!o) return "Order not found.";
      if (o.payment_status === "paid") return "This order is already marked as paid.";
      if (Number(o.total_tzs) <= 0) return "The order total is zero.";
      await db.query(
        "insert into payments (order_id, provider, method, amount_tzs, status, provider_reference, verified_by, verified_at) values ($1,'manual',$2,$3,'paid',$4,$5,now())",
        [orderId, method, o.total_tzs, reference || null, me.id],
      );
      await db.query("update orders set payment_status = 'paid' where id = $1", [orderId]);
      await writeAudit(db, me, { action: "order.paid", entityType: "order", entityId: orderId, after: { method, reference: reference || null } });
      return null;
    });
    if (msg) return fail(msg);
    revalidatePath(`/admin/orders/${orderId}`);
    return ok("Payment recorded.");
  } catch (e) {
    return fail(friendly(e));
  }
}
