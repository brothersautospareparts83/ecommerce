"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";

/** Marks one inquiry as handled (or back to new). Staff only; RLS enforces it again in the database. */
export async function setInquiryStatus(fd: FormData): Promise<void> {
  const me = await requireStaff();
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["new", "handled"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  await withDb(staffSession(me), (db) => db.query("update inquiries set status = $2 where id = $1", [parsed.data.id, parsed.data.status]));
  revalidatePath("/admin/inquiries");
}
