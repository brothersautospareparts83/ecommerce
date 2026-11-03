"use server";

import { z } from "zod";
import { withDb } from "@/lib/db";
import { normalizeTzPhone } from "@/lib/phone";
import { getCurrentProfile } from "@/lib/auth/session";

export type InquiryState = { error?: string; sent?: { name: string; message: string } };

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z.string().trim().transform((v, ctx) => {
    const n = normalizeTzPhone(v);
    if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid Tanzanian phone number, e.g. 0712 345 678" });
    return n ?? "";
  }),
  email: z.string().trim().max(160).email("Enter a valid email or leave it empty").optional().or(z.literal("")),
  message: z.string().trim().min(5, "Write your question (at least 5 characters)").max(1000, "Please keep the message under 1000 characters"),
  website: z.string().max(0).optional(), // honeypot: real visitors leave it empty
});

/** Saves an inquiry from the contact page. The database function validates again; nothing is emailed from here. */
export async function sendInquiry(_prev: InquiryState, fd: FormData): Promise<InquiryState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const me = await getCurrentProfile();
  try {
    await withDb({ kind: "customer", userId: me?.id }, (db) =>
      db.query("select submit_inquiry($1, $2, $3, $4)", [d.name, d.phone, d.email || null, d.message]),
    );
  } catch {
    return { error: "Sorry, we could not save your message. Please try again, or message us on WhatsApp." };
  }
  return { sent: { name: d.name, message: d.message } };
}
