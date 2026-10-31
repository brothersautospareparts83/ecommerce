import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { classificationLabel, type Classification } from "@/lib/catalog/queries";
import { formatTZS } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = { title: "Products (admin)" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const field = "h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-accent";
const PAGE = 50;

const flags = [
  { value: "no-price", label: "No selling price", sql: "p.price_tzs = 0" },
  { value: "unclassified", label: "Not classified", sql: "p.classification::text = 'unverified'" },
  { value: "no-photo", label: "No approved photo", sql: "not exists (select 1 from product_images i where i.product_id = p.id and i.verification_status = 'approved' and i.kind <> 'illustrative')" },
  { value: "no-category", label: "No category", sql: "p.category_id is null" },
  { value: "out", label: "Out of stock", sql: "coalesce(inv.quantity_on_hand, 0) = 0" },
  { value: "low", label: "Low stock (at or below minimum)", sql: "inv.min_stock_level > 0 and inv.quantity_on_hand <= inv.min_stock_level" },
];

async function List({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const me = await requireStaff();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const status = one(sp.status);
  const flag = flags.find((f) => f.value === one(sp.flag));
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const { rows, cats } = await withDb(staffSession(me), async (db) => {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (v: unknown) => (params.push(v), `$${params.length}`);
    if (q) {
      const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
      const norm = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const likeP = add(like);
      let cond = `p.name ilike ${likeP} or p.sku::text ilike ${likeP} or coalesce(p.description, '') ilike ${likeP}`;
      if (norm.length >= 3) cond += ` or exists (select 1 from oem_part_numbers o where o.product_id = p.id and o.normalized like ${add(`%${norm}%`)})`;
      where.push(`(${cond})`);
    }
    if (["draft", "published", "archived", "image_required"].includes(status)) where.push(`p.status = ${add(status)}::product_status`);
    if (one(sp.category) === "none") where.push("p.category_id is null");
    else if (one(sp.category)) where.push(`c.slug = ${add(one(sp.category))}`);
    if (flag) where.push(flag.sql);
    const res = await db.query(
      `select p.id, p.sku::text as sku, p.name, p.status, p.classification, p.price_tzs, p.cost_price_tzs,
              c.name_en as category, coalesce(inv.quantity_on_hand, 0) as qty, coalesce(inv.min_stock_level, 0) as min_level,
              (select part_number from oem_part_numbers o where o.product_id = p.id order by o.is_primary desc, o.part_number limit 1) as part_number,
              exists (select 1 from product_images i where i.product_id = p.id and i.verification_status = 'approved' and i.kind <> 'illustrative') as has_photo,
              count(*) over() as total
       from products p
       left join categories c on c.id = p.category_id
       left join inventory inv on inv.product_id = p.id
       ${where.length ? "where " + where.join(" and ") : ""}
       order by p.created_at desc, p.name
       limit ${PAGE} offset ${(page - 1) * PAGE}`,
      params,
    );
    const cats = (await db.query("select slug, name_en from categories order by sort_order")).rows;
    return { rows: res.rows, cats };
  });
  const total = rows.length ? Number(rows[0].total) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const keep = new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(one(sp.category) && { category: one(sp.category) }), ...(flag && { flag: flag.value }) });
  const href = (n: number) => `/admin/products?${new URLSearchParams({ ...Object.fromEntries(keep), page: String(n) })}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Products</h1>
          <p className="mt-1 text-sm text-muted">Buying prices and quantities are visible to staff only. Customers never see them.</p>
        </div>
        <LinkButton href="/admin/products/new">+ New product</LinkButton>
      </div>

      <form action="/admin/products" className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-3 lg:grid-cols-[2fr_1fr_1fr_1.4fr_auto]">
        <input name="q" defaultValue={q} placeholder="Search name, SKU or part number" aria-label="Search" className={`${field} col-span-2 lg:col-span-1`} />
        <select name="status" defaultValue={status} aria-label="Status" className={field}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="image_required">Image required</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select name="category" defaultValue={one(sp.category)} aria-label="Category" className={field}>
          <option value="">All categories</option>
          <option value="none">No category</option>
          {cats.map((c) => (<option key={c.slug} value={c.slug}>{c.name_en}</option>))}
        </select>
        <select name="flag" defaultValue={flag?.value ?? ""} aria-label="Needs attention" className={field}>
          <option value="">Any (needs attention…)</option>
          {flags.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
        </select>
        <button className="h-10 cursor-pointer rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg">Filter</button>
      </form>

      <p className="mt-4 text-sm text-muted"><span className="font-semibold text-fg">{total}</span> products</p>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Sell</th><th className="px-3 py-3 text-right">Buy</th><th className="px-3 py-3 text-right">Stock</th><th className="px-3 py-3">Needs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border align-top">
            {rows.map((r) => {
              const needs = [
                Number(r.price_tzs) === 0 && "price",
                r.classification === "unverified" && "type",
                !r.has_photo && "photo",
                !r.category && "category",
              ].filter(Boolean) as string[];
              return (
                <tr key={r.id} className="hover:bg-surface-2">
                  <td className="px-3 py-3">
                    <Link href={`/admin/products/${r.id}`} className="font-semibold hover:text-accent-text">{r.name}</Link>
                    <p className="text-xs text-muted">{r.sku}{r.part_number ? ` · ${r.part_number}` : ""} · {classificationLabel[r.classification as Classification]}</p>
                  </td>
                  <td className="px-3 py-3">{r.category ?? "—"}</td>
                  <td className="px-3 py-3 capitalize">{String(r.status).replace("_", " ")}</td>
                  <td className="px-3 py-3 text-right">{Number(r.price_tzs) ? formatTZS(Number(r.price_tzs)) : "—"}</td>
                  <td className="px-3 py-3 text-right">{r.cost_price_tzs != null ? formatTZS(Number(r.cost_price_tzs)) : "—"}</td>
                  <td className={`px-3 py-3 text-right font-semibold ${Number(r.qty) === 0 ? "text-red-600 dark:text-red-400" : ""}`}>{r.qty}</td>
                  <td className="px-3 py-3 text-xs text-muted">{needs.join(", ") || <span className="text-emerald-700 dark:text-emerald-400">ready</span>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-10 text-center text-muted">No products match.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <Link className="font-semibold text-accent-text" href={href(page - 1)}>← Previous</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link className="font-semibold text-accent-text" href={href(page + 1)}>Next →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}

export default function AdminProductsPage(props: PageProps<"/admin/products">) {
  return (
    <Suspense>
      <List searchParams={props.searchParams} />
    </Suspense>
  );
}
