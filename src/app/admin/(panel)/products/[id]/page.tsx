import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { ActionForm, Field, adminInput } from "@/components/admin/action-form";
import { ProductImage } from "@/components/product/product-card";
import { formatDate } from "@/lib/format";
import { formatTZS } from "@/lib/utils";
import { ProductForm } from "../product-form";
import { addImage, addPartNumber, adjustStock, removePartNumber, removeProduct, setImageStatus, setMinStock } from "../actions";

export const metadata: Metadata = { title: "Edit product (admin)" };

const card = "rounded-xl border border-border bg-surface p-5";
const h2 = "mb-3 font-display text-lg font-bold";

async function Editor({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  const { id } = await params;
  const me = await requireStaff();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await withDb(staffSession(me), async (db) => {
    const p = (
      await db.query(
        `select p.id, p.sku::text as sku, p.slug, p.name, p.description, p.category_id, p.brand_id, p.classification, p.condition,
                p.price_tzs, p.cost_price_tzs, p.weight_kg, p.status, p.created_at, p.updated_at,
                inv.quantity_on_hand, inv.min_stock_level, inv.location
         from products p left join inventory inv on inv.product_id = p.id where p.id = $1`,
        [id],
      )
    ).rows[0];
    if (!p) return null;
    return {
      p,
      categories: (await db.query("select id, name_en as name from categories where is_active order by sort_order")).rows as { id: string; name: string }[],
      brands: (await db.query("select id, name::text as name from brands where is_active order by name")).rows as { id: string; name: string }[],
      parts: (await db.query("select id, part_number, is_primary, is_alternative from oem_part_numbers where product_id = $1 order by is_primary desc, part_number", [id])).rows,
      images: (await db.query("select id, url, kind, is_primary, source_name, license, verification_status from product_images where product_id = $1 order by is_primary desc, created_at", [id])).rows,
      moves: (await db.query(
        `select m.created_at, m.quantity_delta, m.quantity_after, m.reason, m.note, pr.email as by
         from inventory_movements m left join profiles pr on pr.id = m.created_by
         where m.product_id = $1 order by m.id desc limit 25`, [id])).rows,
    };
  });
  if (!data) notFound();
  const { p, categories, brands, parts, images, moves } = data;
  const qty = Number(p.quantity_on_hand ?? 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="mb-2 text-sm text-muted"><Link href="/admin/products" className="hover:text-fg">Products</Link> / {p.sku}</p>
        <h1 className="font-display text-3xl font-extrabold">{p.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Added {formatDate(p.created_at)} · updated {formatDate(p.updated_at)}
          {p.status === "published" && <> · <Link href={`/products/${p.slug}`} className="font-semibold text-accent-text hover:underline">view on shop</Link></>}
        </p>
      </div>

      <section className={card}>
        <h2 className={h2}>Details and prices</h2>
        <ProductForm
          categories={categories}
          brands={brands}
          values={{
            id: p.id, name: p.name, sku: p.sku, description: p.description ?? "", categoryId: p.category_id ?? "", brandId: p.brand_id ?? "",
            classification: p.classification, condition: p.condition, priceTzs: Number(p.price_tzs),
            costPriceTzs: p.cost_price_tzs == null ? null : Number(p.cost_price_tzs), weightKg: p.weight_kg == null ? null : Number(p.weight_kg), status: p.status,
          }}
        />
      </section>

      <section className={card}>
        <h2 className={h2}>Stock <span className="text-sm font-normal text-muted">(staff only)</span></h2>
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">On hand</p><p className="font-display text-2xl font-extrabold">{qty}</p></div>
          <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Minimum level</p><p className="font-display text-2xl font-extrabold">{p.min_stock_level}</p></div>
          <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Stock value (buying)</p><p className="font-display text-lg font-extrabold">{p.cost_price_tzs != null ? formatTZS(qty * Number(p.cost_price_tzs)) : "—"}</p></div>
        </div>
        <ActionForm action={adjustStock} submitLabel="Record stock change" className="grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="productId" value={p.id} />
          <Field label="Change" htmlFor="direction"><select id="direction" name="direction" className={adminInput}><option value="add">Add stock</option><option value="remove">Remove stock</option></select></Field>
          <Field label="Quantity" htmlFor="quantity"><input id="quantity" name="quantity" type="number" min={1} step={1} required className={adminInput} /></Field>
          <Field label="Reason" htmlFor="reason">
            <select id="reason" name="reason" className={adminInput}>
              <option value="purchase">Purchase / received</option><option value="sale">Sale</option><option value="return">Customer return</option>
              <option value="damage">Damaged / lost</option><option value="correction">Stock-take correction</option><option value="adjustment">Other adjustment</option><option value="opening_stock">Opening stock</option>
            </select>
          </Field>
          <Field label="Note" htmlFor="note"><input id="note" name="note" maxLength={300} className={adminInput} /></Field>
        </ActionForm>
        <ActionForm action={setMinStock} submitLabel="Save level" variant="secondary" className="mt-4 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="productId" value={p.id} />
          <Field label="Minimum stock level" htmlFor="min"><input id="min" name="min" type="number" min={0} defaultValue={p.min_stock_level} className={adminInput} /></Field>
          <Field label="Shelf / location" htmlFor="location"><input id="location" name="location" defaultValue={p.location ?? ""} maxLength={80} className={adminInput} /></Field>
        </ActionForm>
        <h3 className="mb-2 mt-6 text-sm font-bold">Stock history</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2 text-right">Change</th><th className="px-3 py-2 text-right">After</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Note / by</th></tr></thead>
            <tbody className="divide-y divide-border">
              {moves.map((m, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(m.created_at)}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${m.quantity_delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{m.quantity_delta > 0 ? "+" : ""}{m.quantity_delta}</td>
                  <td className="px-3 py-2 text-right">{m.quantity_after}</td>
                  <td className="px-3 py-2 capitalize">{String(m.reason).replace("_", " ")}</td>
                  <td className="px-3 py-2 text-muted">{m.note ?? ""}{m.by ? ` — ${m.by}` : ""}</td>
                </tr>
              ))}
              {moves.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted">No stock movements yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className={h2}>Part numbers</h2>
        <ul className="mb-4 divide-y divide-border rounded-lg border border-border">
          {parts.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="font-semibold">{n.part_number} <span className="font-normal text-muted">{n.is_primary ? "· main" : n.is_alternative ? "· alternative" : ""}</span></span>
              <ActionForm action={removePartNumber} submitLabel="Remove" variant="secondary" pendingLabel="…" className="space-y-0">
                <input type="hidden" name="id" value={n.id} /><input type="hidden" name="productId" value={p.id} />
              </ActionForm>
            </li>
          ))}
          {parts.length === 0 && <li className="px-3 py-3 text-sm text-muted">No part numbers yet.</li>}
        </ul>
        <ActionForm action={addPartNumber} submitLabel="Add part number" className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="productId" value={p.id} />
          <Field label="Part number" htmlFor="partNumber"><input id="partNumber" name="partNumber" required minLength={3} maxLength={80} className={adminInput} /></Field>
          <Field label="Kind" htmlFor="kind"><select id="kind" name="kind" className={adminInput}><option value="primary">Main (OEM)</option><option value="alternative">Alternative</option></select></Field>
        </ActionForm>
      </section>

      <section className={card}>
        <h2 className={h2}>Photos</h2>
        <p className="mb-4 text-sm text-muted">A product can be published only with an approved real photo of this exact part. Illustrations can be stored but are never shown as a real photo.</p>
        <ul className="mb-4 grid gap-3 sm:grid-cols-2">
          {images.map((img) => (
            <li key={img.id} className="flex gap-3 rounded-lg border border-border p-3">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-border"><ProductImage src={img.url} alt="" /></div>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-semibold capitalize">{String(img.kind).replace("_", " ")}{img.is_primary ? " · main" : ""}</p>
                <p className="capitalize text-muted">{img.verification_status}</p>
                {img.source_name && <p className="truncate text-muted">{img.source_name}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(["approve", "reject", "primary", "delete"] as const).filter((a) => !(a === "approve" && img.verification_status === "approved") && !(a === "reject" && img.verification_status === "rejected") && !(a === "primary" && (img.is_primary || img.verification_status !== "approved")) && !(a === "approve" && img.kind === "illustrative")).map((a) => (
                    <ActionForm key={a} action={setImageStatus} submitLabel={a === "primary" ? "Make main" : a[0].toUpperCase() + a.slice(1)} variant={a === "delete" || a === "reject" ? "danger" : "secondary"} pendingLabel="…" className="space-y-0">
                      <input type="hidden" name="id" value={img.id} /><input type="hidden" name="productId" value={p.id} /><input type="hidden" name="action" value={a} />
                    </ActionForm>
                  ))}
                </div>
              </div>
            </li>
          ))}
          {images.length === 0 && <li className="text-sm text-muted">No photos yet.</li>}
        </ul>
        <ActionForm action={addImage} submitLabel="Add photo" className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="productId" value={p.id} />
          <div className="sm:col-span-2"><Field label="Image address (https://…)" htmlFor="url"><input id="url" name="url" type="url" required placeholder="https://" className={adminInput} /></Field></div>
          <Field label="Where does it come from?" htmlFor="imgkind">
            <select id="imgkind" name="kind" className={adminInput}>
              <option value="own_photo">Our own photo</option><option value="supplier_photo">Supplier photo (with permission)</option>
              <option value="manufacturer_photo">Manufacturer photo (licensed)</option><option value="illustrative">Illustration (not a real photo)</option>
            </select>
          </Field>
          <Field label="Source / photographer" htmlFor="sourceName"><input id="sourceName" name="sourceName" maxLength={120} className={adminInput} /></Field>
          <Field label="Licence / permission" htmlFor="license"><input id="license" name="license" maxLength={160} className={adminInput} /></Field>
          <Field label="Credit line (if required)" htmlFor="attribution"><input id="attribution" name="attribution" maxLength={200} className={adminInput} /></Field>
          <label className="flex items-start gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="confirm" value="yes" className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            I confirm this is a real, correct photo of this exact part, and approve it now.
          </label>
        </ActionForm>
      </section>

      <section className={card}>
        <h2 className={h2}>Remove product</h2>
        <p className="mb-3 text-sm text-muted">Products with stock or order history are archived instead of deleted, so records stay intact.</p>
        <ActionForm action={removeProduct} submitLabel="Delete / archive this product" variant="danger">
          <input type="hidden" name="id" value={p.id} />
        </ActionForm>
      </section>
    </div>
  );
}

export default function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense>
      <Editor params={props.params} />
    </Suspense>
  );
}
