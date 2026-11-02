import Link from "next/link";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { formatDate, orderStatusLabel } from "@/lib/format";
import { formatTZS } from "@/lib/utils";

export const metadata = { title: "Orders" };

const FILTERS = ["all", "pending", "confirmed", "processing", "ready_for_pickup", "shipped", "delivered", "cancelled"] as const;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const me = await requireStaff();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (FILTERS as readonly string[]).includes(sp.status) && sp.status !== "all" ? sp.status : null;
  const rows = await withDb(staffSession(me), async (db) =>
    (
      await db.query(
        `select o.id, o.reference, o.customer_name, o.phone, o.status, o.payment_status, o.total_tzs, o.delivery_method, o.created_at,
                (select p.status from order_photo_checks p where p.order_id = o.id order by p.created_at desc limit 1) as photo_status
         from orders o ${status ? "where o.status = $1" : ""} order by o.created_at desc limit 200`,
        status ? [status] : [],
      )
    ).rows,
  );
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Orders</h1>
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((f) => (
          <Link key={f} href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={`rounded-full border px-3 py-1 ${(status ?? "all") === f ? "border-accent bg-accent text-accent-fg" : "border-border hover:border-accent"}`}>
            {f === "all" ? "All" : orderStatusLabel[f]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-muted">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3">Photo</th><th className="p-3 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-accent-text hover:underline">{o.reference}</Link><div className="text-xs text-muted">{formatDate(o.created_at)}</div></td>
                  <td className="p-3">{o.customer_name}<div className="text-xs text-muted">{o.phone}</div></td>
                  <td className="p-3">{orderStatusLabel[o.status] ?? o.status}</td>
                  <td className="p-3">{o.payment_status === "paid" ? "Paid" : "Not paid"}</td>
                  <td className="p-3">{o.photo_status === "approved" ? "Approved" : o.photo_status === "rejected" ? "Rejected" : o.photo_status === "pending" ? "Waiting for customer" : "None yet"}</td>
                  <td className="p-3 text-right font-semibold">{formatTZS(Number(o.total_tzs))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
