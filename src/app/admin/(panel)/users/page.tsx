import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { formatDate, roleLabel } from "@/lib/format";
import { RoleForm } from "./role-form";

export const metadata: Metadata = { title: "Users & Roles" };

async function Users() {
  const me = await requireAdmin();
  const users = await withDb(staffSession(me), async (db) => {
    const res = await db.query(
      `select p.id, p.email, p.full_name, p.role, p.created_at, c.customer_type
       from profiles p left join customers c on c.profile_id = p.id
       order by p.created_at desc limit 200`,
    );
    return res.rows;
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Users &amp; roles</h1>
      <p className="mt-1 text-sm text-muted">
        Admins can move people between Customer and Staff. Only the Owner can grant Admin or Owner. You cannot change your own role. Every change is recorded in the audit log.
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Role</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><p className="font-semibold">{u.full_name ?? "—"}</p><p className="text-xs text-muted">{u.email}</p></td>
                <td className="px-4 py-3 capitalize">{u.customer_type ?? "—"}</td>
                <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  {u.id === me.id ? <span className="text-muted">{roleLabel[u.role]} (you)</span> : <RoleForm profileId={u.id} role={u.role} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <Users />
    </Suspense>
  );
}
