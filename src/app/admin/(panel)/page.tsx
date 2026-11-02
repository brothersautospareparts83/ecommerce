import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { formatTZS } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function Stats() {
  const me = await requireStaff();
  // Every figure below is a live count or sum from the database; nothing is estimated.
  const s = await withDb(staffSession(me), async (db) => {
    const q = async (sql: string) => (await db.query(sql)).rows[0] as Record<string, string>;
    const products = await q("select count(*) total, count(*) filter (where status = 'published') published from products");
    const orders = await q(`select count(*) total,
        count(*) filter (where status = 'pending') pending,
        coalesce(sum(total_tzs) filter (where status <> 'cancelled' and payment_status = 'paid'
          and (created_at at time zone 'Africa/Dar_es_Salaam')::date = (now() at time zone 'Africa/Dar_es_Salaam')::date), 0) as sales_today,
        coalesce(sum(total_tzs) filter (where status <> 'cancelled' and payment_status = 'paid'
          and date_trunc('month', created_at at time zone 'Africa/Dar_es_Salaam') = date_trunc('month', now() at time zone 'Africa/Dar_es_Salaam')), 0) as sales_month
      from orders`);
    const stock = await q("select count(*) low from inventory i join products p on p.id = i.product_id where p.status <> 'archived' and i.quantity_on_hand <= i.min_stock_level");
    const customers = await q("select count(*) new from customers where created_at > now() - interval '30 days'");
    const quotes = await q("select count(*) pending from quotations where status in ('submitted', 'under_review')");
    const images = await q("select count(*) pending from image_verification_queue where status in ('pending', 'manual_review')");
    return { products, orders, stock, customers, quotes, images };
  });

  const cards: [string, string, string?][] = [
    ["Total products", s.products.total, `${s.products.published} published`],
    ["Total orders", s.orders.total],
    ["Pending orders", s.orders.pending],
    ["Paid sales today", formatTZS(Number(s.orders.sales_today)), "Paid, non-cancelled orders"],
    ["Paid revenue this month", formatTZS(Number(s.orders.sales_month)), "Paid, non-cancelled orders"],
    ["Low or out of stock", s.stock.low, "At or below minimum level"],
    ["New customers (30 days)", s.customers.new],
    ["Pending quotations", s.quotes.pending],
    ["Images awaiting verification", s.images.pending],
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Live figures from the database. Best-seller rankings arrive with the analytics phase.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
            {note && <p className="mt-1 text-xs text-muted">{note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <Stats />
    </Suspense>
  );
}
