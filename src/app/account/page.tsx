import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { customerSession, isStaffRole, requireUser } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { LinkButton } from "@/components/ui/button";
import { formatDate, orderStatusLabel, roleLabel } from "@/lib/format";
import { formatTZS } from "@/lib/utils";

export const metadata: Metadata = { title: "My Account" };

async function Overview() {
  const profile = await requireUser();
  const { customer, orders } = await withDb(customerSession(profile), async (db) => {
    const c = await db.query("select customer_type, approval_status from customers where profile_id = $1", [profile.id]);
    const o = await db.query("select reference, status, total_tzs, created_at from orders order by created_at desc limit 3");
    return { customer: c.rows[0], orders: o.rows };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Hello{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-muted">{profile.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Account type</p>
          <p className="mt-1 font-display text-lg font-bold capitalize">{customer?.customer_type ?? "retail"}</p>
          <p className="text-xs text-muted">{roleLabel[profile.role]} access</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Phone</p>
          <p className="mt-1 font-display text-lg font-bold">{profile.phone ?? "Not added"}</p>
          <Link href="/account/profile" className="text-xs font-semibold text-accent-text hover:underline">Update profile</Link>
        </div>
        {isStaffRole(profile.role) && (
          <div className="rounded-xl border border-accent bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Staff</p>
            <p className="mt-1 text-sm text-muted">You have admin access.</p>
            <LinkButton href="/admin" size="sm" className="mt-2">Open admin</LinkButton>
          </div>
        )}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-accent-text hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
            You have no orders yet. <Link href="/shop" className="font-semibold text-accent-text hover:underline">Browse parts</Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {orders.map((o) => (
              <li key={o.reference} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="font-semibold">{o.reference}</span>
                <span className="text-muted">{formatDate(o.created_at)}</span>
                <span>{orderStatusLabel[o.status]}</span>
                <span className="font-semibold">{formatTZS(Number(o.total_tzs))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
