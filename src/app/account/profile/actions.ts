"use server";

import { z } from "zod";
import { customerSession, requireUser } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { normalizeTzPhone } from "@/lib/phone";

export interface ProfileFormState {
  ok: boolean;
  message: string;
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().max(30).optional(),
  preferred_language: z.enum(["en", "sw"]),
});

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const profile = await requireUser();
  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
    preferred_language: formData.get("preferred_language"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  let phone: string | null = null;
  if (parsed.data.phone) {
    phone = normalizeTzPhone(parsed.data.phone);
    if (!phone) return { ok: false, message: "Enter a valid Tanzanian phone number, e.g. 0712 345 678." };
  }

  // Row Level Security restricts this UPDATE to the user's own profile row.
  const updated = await withDb(customerSession(profile), async (db) => {
    const res = await db.query(
      "update profiles set full_name = $1, phone = $2, preferred_language = $3 where id = $4",
      [parsed.data.full_name, phone, parsed.data.preferred_language, profile.id],
    );
    return res.rowCount;
  });
  return updated === 1 ? { ok: true, message: "Profile saved." } : { ok: false, message: "Could not save your profile." };
}
