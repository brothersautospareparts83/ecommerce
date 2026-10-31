import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatTZS } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory (admin)" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const PAGE = 50;

async function Inventory({ searchParams }: Pick<PageProps<"/admin/inventory">, "searchParams">) {
  const me = await requireStaff();
  const sp = await searchParams;
  const view = one(sp.view) === "out" ? "out" : one(sp.view) === "low" ? "low" : "all";
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);
  const filter = view === "out" ? "coalesce(i.quantity_on_hand,0) = 0" : view === "low" ? "i.min_stock_level > 0 and i.quantity_on_hand <= i.min_stock_level" : "true";

  const d = await withDb(staffSession(me), async (db) => {
    const summary = (
      await db.query(
        `select count(*)::int as products,
                coalesce(sum(i.quantity_on_hand), 0)::bigint as units,
                coalesce(sum(i.quantity_on_hand::bigint * p.cost_price_tzs), 0)::bigint as valuation,
                count(*) filter (where i.quantity_on_hand = 0)::int as out_count,
                count(*) filter (where i.min_stock_level > 0 and i.quantity_on_hand <= i.min_stock_level)::int as low_count,
                count(*) filter (where i.quantity_on_hand > 0 and p.cost_price_tzs is null)::int as uncosted
         from inventory i join products p on p.id = i.product_id where p.status <> 'archived'`,
      )
    ).rows[0];
    const rows = (
      await db.query(
        `select p.id, p.sku::text as sku, p.name, i.quantity_on_hand, i.min_stock_level, i.location, p.cost_price_tzs, count(*) over() as total
         from inventory i join products p on p.id = i.product_id
         where p.status <> 'archived' and ${filter}
         order by i.quantity_on_hand asc, p.name limit ${PAGE} offset ${(page - 1) * PAGE}`,
      )
    ).rows;
    const moves = (
      await db.query(
        `select m.created_at, m.quantity_delta, m.quantity_after, m.reason, m.note, p.id as product_id, p.name, p.sku::text as sku
         from inventory_movements m join products p on p.id = m.product_id where m.reason <> 'import' order by m.id desc limit 30`,
      )
    ).rows;
    return { summary, rows, moves };
  });
  const { summary: s, rows, moves } = d;
  const total = rows.length ? Number(rows[0].total) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const tab = (v: string, label: string) => (
    <Link href={`/admin/inventory?view=${v}`} className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === v ? "bg-accent text-accent-fg" : "border border-border hover:border-accent"}`}>{label}</Link>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Inventory</h1>
        <p className="mt-1 text-sm text-muted">Staff only. Quantities change only through recorded stock movements.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Products tracked", String(s.products)],
          ["Units on hand", Number(s.units).toLocaleString("en-US")],
          ["Stock value (at buying price)", formatTZS(Number(s.valuation)), s.uncosted > 0 ? `${s.uncosted} items in stock have no buying price and are not counted` : undefined],
          ["Out of stock", String(s.out_count), `${s.low_count} at or below minimum level`],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
            {note && <p className="mt-1 text-xs text-muted">{note}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">{tab("all", "All")}{tab("low", "Low stock")}{tab("out", "Out of stock")}</div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Location</th><th className="px-3 py-3 text-right">On hand</th><th className="px-3 py-3 text-right">Minimum</th><th className="px-3 py-3 text-right">Value</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2">
                <td className="px-3 py-2"><Link href={`/admin/products/${r.id}`} className="font-semibold hover:text-accent-text">{r.name}</Link><p className="text-xs text-muted">{r.sku}</p></td>
                <td className="px-3 py-2">{r.location ?? "—"}</td>
                <td className={`px-3 py-2 text-right font-semibold ${r.quantity_on_hand === 0 ? "text-red-600 dark:text-red-400" : ""}`}>{r.quantity_on_hand}</td>
                <td className="px-3 py-2 text-right">{r.min_stock_level}</td>
                <td className="px-3 py-2 text-right">{r.cost_price_tzs != null ? formatTZS(Number(r.cost_price_tzs) * r.quantity_on_hand) : "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? <Link className="font-semibold text-accent-text" href={`/admin/inventory?view=${view}&page=${page - 1}`}>← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link className="font-semibold text-accent-text" href={`/admin/inventory?view=${view}&page=${page + 1}`}>Next →</Link> : <span />}
        </nav>
      )}

      <section>
        <h2 className="mb-2 font-display text-lg font-bold">Recent stock changes</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-border">
              {moves.map((m, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(m.created_at)}</td>
                  <td className="px-3 py-2"><Link href={`/admin/products/${m.product_id}`} className="font-semibold hover:text-accent-text">{m.name}</Link></td>
                  <td className={`px-3 py-2 text-right font-semibold ${m.quantity_delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{m.quantity_delta > 0 ? "+" : ""}{m.quantity_delta}</td>
                  <td className="px-3 py-2 capitalize">{String(m.reason).replace("_", " ")}</td>
                  <td className="px-3 py-2 text-muted">{m.note ?? ""}</td>
                </tr>
              ))}
              {moves.length === 0 && <tr><td className="px-3 py-6 text-center text-muted">No manual stock changes yet. Opening stock from the import is on each product&apos;s history.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function InventoryPage(props: PageProps<"/admin/inventory">) {
  return (
    <Suspense>
      <Inventory searchParams={props.searchParams} />
    </Suspense>
  );
}
