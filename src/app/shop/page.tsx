import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { CollapsibleFilters } from "@/components/product/collapsible-filters";
import { Button, LinkButton } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { publicBrands, publicCategories, searchAndLog, type SortKey } from "@/lib/catalog/public";

export const metadata: Metadata = { title: "Shop All Products" };

const sorts: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "mixed", label: "Mixed" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];
const classes = [
  { value: "genuine_oem", label: "Genuine OEM" },
  { value: "oem_equivalent", label: "OEM equivalent" },
  { value: "aftermarket", label: "Aftermarket" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const field = "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

async function Results({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const [cats, brands] = await Promise.all([publicCategories(), publicBrands()]);
  const category = cats.some((c) => c.slug === one(sp.category)) ? one(sp.category) : "";
  const brand = brands.some((b) => b.slug === one(sp.brand)) ? one(sp.brand) : "";
  const classification = classes.some((c) => c.value === one(sp.classification)) ? one(sp.classification) : "";
  const sort = (sorts.some((s) => s.value === one(sp.sort)) ? one(sp.sort) : q ? "relevance" : "mixed") as SortKey;
  const inStock = one(sp.stock) === "1";
  const page = Math.max(1, parseInt(one(sp.page), 10) || 1);

  const result = await searchAndLog({ q, category, brand, classification, inStock, sort, page, pageSize: 24 });
  const filtered = Boolean(q || category || brand || classification || inStock);

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (brand) params.set("brand", brand);
  if (classification) params.set("classification", classification);
  if (inStock) params.set("stock", "1");
  if (one(sp.sort)) params.set("sort", sort);
  const pageHref = (n: number) => `/shop?${new URLSearchParams({ ...Object.fromEntries(params), page: String(n) })}`;

  return (
    <>
      <form action="/shop" className="rounded-xl border border-border bg-surface p-3 sm:p-4">
        <CollapsibleFilters activeCount={[q, one(sp.category), one(sp.type), inStock ? "1" : ""].filter(Boolean).length}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-4">
            <label htmlFor="shop-q" className="mb-1 block text-xs font-semibold text-muted">Search by name, part number or SKU</label>
            <input id="shop-q" name="q" type="search" defaultValue={q} placeholder="e.g. brake drum, 42431-0K120, breki" className={field} />
          </div>
          <div>
            <label htmlFor="shop-cat" className="mb-1 block text-xs font-semibold text-muted">Category</label>
            <select id="shop-cat" name="category" defaultValue={category} className={field}>
              <option value="">All categories</option>
              {cats.map((c) => (<option key={c.slug} value={c.slug}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="shop-sort" className="mb-1 block text-xs font-semibold text-muted">Sort by</label>
            <select id="shop-sort" name="sort" defaultValue={sort} className={field}>
              {sorts.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="shop-class" className="mb-1 block text-xs font-semibold text-muted">Type</label>
            <select id="shop-class" name="classification" defaultValue={classification} className={field}>
              <option value="">All types</option>
              {classes.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </div>
          {brands.length > 0 && (
            <div>
              <label htmlFor="shop-brand" className="mb-1 block text-xs font-semibold text-muted">Brand</label>
              <select id="shop-brand" name="brand" defaultValue={brand} className={field}>
                <option value="">All brands</option>
                {brands.map((b) => (<option key={b.slug} value={b.slug}>{b.name}</option>))}
              </select>
            </div>
          )}
          <Button type="submit" size="md">Apply</Button>
        </div>
        </CollapsibleFilters>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <p className="text-muted" aria-live="polite">
          <span className="font-semibold text-fg">{result.total}</span> {result.total === 1 ? "product" : "products"}
          {q && <> for “{q}”</>}
        </p>
        {filtered && <Link href="/shop" className="font-semibold text-accent-text hover:underline">Clear filters</Link>}
      </div>

      {result.items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          {filtered ? <SearchX className="mb-3 h-8 w-8 text-muted" /> : <PackageSearch className="mb-3 h-8 w-8 text-muted" />}
          <p className="font-display text-lg font-bold">{filtered ? "No products match your search" : "Our online catalogue is being prepared"}</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            {filtered
              ? "Try a shorter name or a part number, or ask us on WhatsApp and we will find it for you."
              : "We stock thousands of parts at our shop in Kariakoo. Send us the part name, number or a photo and we will confirm price and availability."}
          </p>
          <div className="mt-5"><WhatsAppButton /></div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {result.items.map((p) => (<ProductCard key={p.id} product={p} />))}
        </div>
      )}

      {result.pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
          {result.page > 1 ? <LinkButton href={pageHref(result.page - 1)} variant="secondary" size="sm">← Previous</LinkButton> : <span />}
          <span className="text-sm text-muted">Page {result.page} of {result.pages}</span>
          {result.page < result.pages ? <LinkButton href={pageHref(result.page + 1)} variant="secondary" size="sm">Next →</LinkButton> : <span />}
        </nav>
      )}
    </>
  );
}

export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-5 font-display text-2xl font-extrabold sm:text-3xl">Shop all products</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface-2" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
