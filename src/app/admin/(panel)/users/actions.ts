"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export interface RoleChangeState {
  ok: boolean;
  message: string;
}

const schema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(["customer", "staff", "admin", "owner"]),
});

/**
 * Admins can move people between customer and staff. Only the owner can grant or remove
 * admin/owner. Nobody can change their own role. The database enforces the same rule set
 * (an admin/owner session is required), and every change is audited.
 */
export async function changeRole(_prev: RoleChangeState, formData: FormData): Promise<RoleChangeState> {
  const me = await requireAdmin();
  const parsed = schema.safeParse({ profileId: formData.get("profileId"), role: formData.get("role") });
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { profileId, role } = parsed.data;

  if (profileId === me.id) return { ok: false, message: "You cannot change your own role." };

  try {
    return await withDb(staffSession(me), async (db) => {
      const cur = await db.query("select id, email, role from profiles where id = $1 for update", [profileId]);
      const target = cur.rows[0];
      if (!target) return { ok: false, message: "User not found." };
      if (target.role === role) return { ok: true, message: "No change." };

      const touchesTopRoles = ["admin", "owner"].includes(role) || ["admin", "owner"].includes(target.role);
      if (touchesTopRoles && me.role !== "owner") {
        return { ok: false, message: "Only the owner can grant or remove admin and owner roles." };
      }

      await db.query("update profiles set role = $1 where id = $2", [role, profileId]);
      await writeAudit(db, me, {
        action: "role.change",
        entityType: "profile",
        entityId: profileId,
        before: { role: target.role, email: target.email },
        after: { role },
      });
      return { ok: true, message: `${target.email} is now ${role}.` };
    });
  } finally {
    revalidatePath("/admin/users");
  }
}
