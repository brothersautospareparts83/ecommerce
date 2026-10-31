import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";

export const metadata: Metadata = { title: "Audit Logs" };

async function Logs() {
  const me = await requireAdmin();
  const rows = await withDb(staffSession(me), async (db) => {
    const res = await db.query(
      `select a.id, a.created_at, a.action, a.entity_type, a.entity_id, a.actor_role, p.email as actor_email, a.before_data, a.after_data
       from audit_logs a left join profiles p on p.id = a.actor_id
       order by a.id desc limit 100`,
    );
    return res.rows;
  });
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Audit logs</h1>
      <p className="mt-1 text-sm text-muted">Latest 100 administrative actions. Records cannot be edited or deleted.</p>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted">No actions recorded yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Change</th></tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3">{new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Africa/Dar_es_Salaam" })}</td>
                  <td className="px-4 py-3">{r.actor_email ?? "—"}<span className="block text-xs text-muted">{r.actor_role}</span></td>
                  <td className="px-4 py-3 font-semibold">{r.action}</td>
                  <td className="px-4 py-3">{r.entity_type}<span className="block break-all text-xs text-muted">{r.entity_id}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{r.before_data && <>from {JSON.stringify(r.before_data)}<br /></>}{r.after_data && <>to {JSON.stringify(r.after_data)}</>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <Suspense>
      <Logs />
    </Suspense>
  );
}
