"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { withDb } from "@/lib/db";

const schema = z.object({
  ref: z.string().trim().regex(/^BAS-\d{6}-\d{5}$/),
  code: z.string().trim().regex(/^[A-Za-z0-9]{8}$/),
  photoId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  comment: z.string().trim().max(300).optional(),
});

/** The customer approves or rejects the photo of their exact part. The tracking code is the only credential. */
export async function respondToPhoto(fd: FormData): Promise<void> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) redirect("/orders/track");
  const { ref, code, photoId, decision, comment } = parsed.data;
  await withDb({ kind: "customer" }, (db) =>
    db.query("select respond_photo_check($1, $2, $3, $4, $5)", [ref, code, photoId, decision === "approve", comment || null]),
  );
  redirect(`/orders/track?ref=${encodeURIComponent(ref)}&code=${encodeURIComponent(code.toUpperCase())}`);
}
