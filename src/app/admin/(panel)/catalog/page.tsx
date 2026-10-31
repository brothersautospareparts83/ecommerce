import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { ActionForm, Field, adminInput } from "@/components/admin/action-form";
import { addBrand, saveBrand, saveCategory } from "./actions";

export const metadata: Metadata = { title: "Categories & brands (admin)" };

async function Catalog() {
  const me = await requireStaff();
  const { cats, brands } = await withDb(staffSession(me), async (db) => ({
    cats: (await db.query(
      `select c.id, c.name_en, c.name_sw, c.sort_order, c.is_active, (select count(*)::int from products p where p.category_id = c.id) as n
       from categories c order by c.sort_order, c.name_en`)).rows,
    brands: (await db.query(
      `select b.id, b.name::text as name, b.is_active, (select count(*)::int from products p where p.brand_id = b.id) as n from brands b order by b.name`)).rows,
  }));

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Categories &amp; brands</h1>
        <p className="mt-1 text-sm text-muted">Customers only see categories and brands that are active and have published products.</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Categories</h2>
        <ul className="space-y-3">
          {cats.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-surface p-4">
              <ActionForm action={saveCategory} submitLabel="Save" variant="secondary" className="grid items-end gap-3 sm:grid-cols-[2fr_2fr_90px_auto_auto]">
                <input type="hidden" name="id" value={c.id} />
                <Field label={`Name (${c.n} products)`} htmlFor={`en-${c.id}`}><input id={`en-${c.id}`} name="nameEn" defaultValue={c.name_en} required className={adminInput} /></Field>
                <Field label="Kiswahili name" htmlFor={`sw-${c.id}`}><input id={`sw-${c.id}`} name="nameSw" defaultValue={c.name_sw ?? ""} className={adminInput} /></Field>
                <Field label="Order" htmlFor={`o-${c.id}`}><input id={`o-${c.id}`} name="sortOrder" type="number" min={0} defaultValue={c.sort_order} className={adminInput} /></Field>
                <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={c.is_active} className="h-4 w-4 accent-[var(--accent)]" /> Active</label>
              </ActionForm>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Brands</h2>
        <ActionForm action={addBrand} submitLabel="Add brand" className="mb-4 grid items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[2fr_1.5fr_auto]">
          <Field label="New brand name" htmlFor="brand-name"><input id="brand-name" name="name" required minLength={2} className={adminInput} /></Field>
          <Field label="Country (optional)" htmlFor="brand-country"><input id="brand-country" name="country" className={adminInput} /></Field>
        </ActionForm>
        <ul className="space-y-3">
          {brands.map((b) => (
            <li key={b.id} className="rounded-xl border border-border bg-surface p-4">
              <ActionForm action={saveBrand} submitLabel="Save" variant="secondary" className="grid items-end gap-3 sm:grid-cols-[3fr_auto_auto]">
                <input type="hidden" name="id" value={b.id} />
                <Field label={`Name (${b.n} products)`} htmlFor={`b-${b.id}`}><input id={`b-${b.id}`} name="name" defaultValue={b.name} required className={adminInput} /></Field>
                <label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={b.is_active} className="h-4 w-4 accent-[var(--accent)]" /> Active</label>
              </ActionForm>
            </li>
          ))}
          {brands.length === 0 && <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">No brands yet. The imported stock list has no brand column, so add brands here and assign them to products.</li>}
        </ul>
      </section>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense>
      <Catalog />
    </Suspense>
  );
}
