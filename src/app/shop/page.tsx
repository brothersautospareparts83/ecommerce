import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { categories, products } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Shop All Products" };

const sorts = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const selectCls = "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

async function Results({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const category = categories.some((c) => c.slug === one(sp.category)) ? one(sp.category) : "";
  const sort = sorts.some((s) => s.value === one(sp.sort)) ? one(sp.sort) : "featured";
  const inStock = one(sp.stock) === "1";

  // Demo data is filtered in memory. Phase 4 swaps this for a database query with the same parameters.
  const needle = q.toLowerCase();
  let list = products.filter(
    (p) =>
      (!category || p.categorySlug === category) &&
      (!inStock || p.stock > 0) &&
      (!needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle) || p.brand.toLowerCase().includes(needle)),
  );
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = Boolean(q || category || inStock || sort !== "featured");

  return (
    <>
      <form action="/shop" className="rounded-xl border border-border bg-surface p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-[2fr_1.3fr_1.3fr_auto_auto] lg:items-end">
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="shop-q" className="mb-1 block text-xs font-semibold text-muted">Search</label>
            <input id="shop-q" name="q" type="search" defaultValue={q} placeholder="Part name, SKU or brand" className={selectCls} />
          </div>
          <div>
            <label htmlFor="shop-cat" className="mb-1 block text-xs font-semibold text-muted">Category</label>
            <select id="shop-cat" name="category" defaultValue={category} className={selectCls}>
              <option value="">All categories</option>
              {categories.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="shop-sort" className="mb-1 block text-xs font-semibold text-muted">Sort by</label>
            <select id="shop-sort" name="sort" defaultValue={sort} className={selectCls}>
              {sorts.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <label className="flex h-11 items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="stock" value="1" defaultChecked={inStock} className="h-4 w-4 accent-[var(--accent)]" />
            In stock only
          </label>
          <Button type="submit" size="md">Apply</Button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <p className="text-muted" aria-live="polite">
          <span className="font-semibold text-fg">{list.length}</span> {list.length === 1 ? "product" : "products"}
          {q && <> for “{q}”</>}
        </p>
        {filtered && <Link href="/shop" className="font-semibold text-accent-text hover:underline">Clear filters</Link>}
      </div>

      {list.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <SearchX className="mb-3 h-8 w-8 text-muted" />
          <p className="font-display text-lg font-bold">No products match your search</p>
          <p className="mt-1 max-w-sm text-sm text-muted">Try a shorter name, a part number, or ask us on WhatsApp and we will find it for you.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (<ProductCard key={p.slug} product={p} />))}
        </div>
      )}
    </>
  );
}

export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Shop all products</h1>
      <p className="mt-1 mb-4 text-xs text-muted sm:mb-6 sm:text-sm">Showing DEMO records for layout review. Real catalog data arrives with the product catalog build.</p>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface-2" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
