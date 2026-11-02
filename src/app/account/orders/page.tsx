import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { customerSession, requireUser } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { formatTZS } from "@/lib/utils";

export const metadata: Metadata = { title: "My Orders" };

async function Orders() {
  const profile = await requireUser();
  // Row Level Security limits this to the signed-in customer's own orders.
  const orders = await withDb(customerSession(profile), async (db) => {
    const res = await db.query(
      `select o.reference, o.status, o.payment_status, o.total_tzs, o.created_at,
              (select count(*)::int from order_items i where i.order_id = o.id) as items
       from orders o order by o.created_at desc limit 100`,
    );
    return res.rows;
  });

  return (
    <div>
      <h1 className="text-3xl font-extrabold">My orders</h1>
      {orders.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          No orders yet. <Link href="/shop" className="font-semibold text-accent-text hover:underline">Browse parts</Link>
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.reference}>
                  <td className="px-4 py-3 font-semibold">{o.reference}</td>
                  <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                  <td className="px-4 py-3">{o.items}</td>
                  <td className="px-4 py-3">{orderStatusLabel[o.status]}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatTZS(Number(o.total_tzs))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}
