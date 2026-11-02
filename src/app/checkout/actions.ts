"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { withDb } from "@/lib/db";
import { normalizeTzPhone } from "@/lib/phone";
import { getCurrentProfile } from "@/lib/auth/session";

export type CheckoutState = { error?: string };

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z.string().trim().transform((v, ctx) => {
    const n = normalizeTzPhone(v);
    if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid Tanzanian phone number, e.g. 0712 345 678" });
    return n ?? "";
  }),
  email: z.string().trim().max(160).email("Enter a valid email or leave it empty").optional().or(z.literal("")),
  method: z.enum(["pickup", "delivery"]),
  region: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z.string().transform((v, ctx) => {
    try {
      const arr = JSON.parse(v);
      const parsed = z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(100).safeParse(arr);
      if (parsed.success) return parsed.data;
    } catch {
      // fall through to the error below
    }
    ctx.addIssue({ code: "custom", message: "Your cart is empty" });
    return [];
  }),
});

/** Prices, stock and totals are all decided in the database (place_order); the browser only sends product ids and quantities. */
export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.method === "delivery" && !d.address) return { error: "Enter your delivery address" };

  const me = await getCurrentProfile();
  let ref: string;
  let total: string;
  let code: string;
  try {
    const res = await withDb({ kind: "customer", userId: me?.id }, (db) =>
      db.query("select * from place_order($1, $2, $3, $4::delivery_method, $5::jsonb, $6, $7::jsonb)", [
        d.name, d.phone, d.email || null, d.method,
        d.method === "delivery" ? JSON.stringify({ region: d.region || null, address: d.address }) : null,
        d.notes || null, JSON.stringify(d.items),
      ]),
    );
    ref = res.rows[0].reference;
    total = String(res.rows[0].total_tzs);
    code = String(res.rows[0].tracking_code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("OUT OF STOCK")) return { error: `Sorry, not enough stock: ${msg.slice(14)}. Lower the quantity in your cart.` };
    if (msg.startsWith("NO PRICE")) return { error: `${msg.slice(10)} has no price yet. Remove it and ask us on WhatsApp.` };
    if (msg.startsWith("PRODUCT UNAVAILABLE")) return { error: "A part in your cart is no longer available. Remove it and try again." };
    console.error("placeOrder failed", e);
    return { error: "We could not place your order. Please try again or order on WhatsApp." };
  }
  redirect(`/checkout/done?ref=${encodeURIComponent(ref)}&total=${encodeURIComponent(total)}&code=${encodeURIComponent(code)}`);
}
