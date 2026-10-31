import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "./server";
import { withDb } from "@/lib/db";

export type Role = "customer" | "staff" | "admin" | "owner";

export interface Profile {
  id: string;
  auth_user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: Role;
  preferred_language: "en" | "sw";
  is_active: boolean;
}

/**
 * The signed-in user's application profile, created on first login.
 * Identity comes only from the verified Neon Auth session; the role comes from our database.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  await connection(); // session data is per-request: never prerender it
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user?.id) return null;

  const profile = await withDb({ kind: "customer" }, async (db) => {
    const res = await db.query("select * from ensure_profile($1, $2, $3)", [user.id, user.email ?? null, user.name ?? null]);
    return res.rows[0] as Profile;
  });
  return profile.is_active ? profile : null;
});

export const isStaffRole = (role: Role) => role === "staff" || role === "admin" || role === "owner";
export const isAdminRole = (role: Role) => role === "admin" || role === "owner";

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Staff, admin or owner. Customers are sent to their own dashboard. */
export async function requireStaff(): Promise<Profile> {
  const profile = await requireUser();
  if (!isStaffRole(profile.role)) redirect("/account");
  return profile;
}

/** Admin or owner only. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff();
  if (!isAdminRole(profile.role)) redirect("/admin");
  return profile;
}

/** Database session for queries made on behalf of the signed-in customer. */
export const customerSession = (p: Profile) => ({ kind: "customer" as const, userId: p.id });
/** Database session for staff queries; role decides admin-only database actions. */
export const staffSession = (p: Profile) => ({ kind: "staff" as const, userId: p.id, role: p.role as "staff" | "admin" | "owner" });
