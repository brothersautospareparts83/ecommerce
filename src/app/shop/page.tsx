import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, SearchX } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { CollapsibleFilters } from "@/components/product/collapsible-filters";
import { CategoryBar } from "@/components/product/category-bar";
import { T } from "@/lib/i18n";
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
const field = "h-12 w-full rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-accent focus:bg-surface";

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
      <CategoryBar active={category} />
      <form action="/shop" className="rounded-2xl border border-border bg-surface p-3 sm:p-4">
        <CollapsibleFilters activeCount={[q, one(sp.category), one(sp.type), inStock ? "1" : ""].filter(Boolean).length}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-4">
          <input type="hidden" name="q" value={q} />
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
          <Button type="submit" size="lg" className="col-span-2 rounded-xl lg:col-span-1 lg:self-end"><T en="Apply" sw="Tumia" /></Button>
        </div>
        </CollapsibleFilters>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <p className="text-muted" aria-live="polite">
          <span className="font-semibold text-fg">{result.total}</span> {result.total === 1 ? <T en="product" sw="bidhaa" /> : <T en="products" sw="bidhaa" />}
          {q && <> for “{q}”</>}
        </p>
        {filtered && <Link href="/shop" className="font-semibold text-accent-text hover:underline"><T en="Clear filters" sw="Futa vichujio" /></Link>}
      </div>

      {result.items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
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
          {result.page > 1 ? <LinkButton href={pageHref(result.page - 1)} variant="secondary" size="sm"><T en="← Previous" sw="← Iliyopita" /></LinkButton> : <span />}
          <span className="text-sm text-muted">Page {result.page} of {result.pages}</span>
          {result.page < result.pages ? <LinkButton href={pageHref(result.page + 1)} variant="secondary" size="sm"><T en="Next →" sw="Inayofuata →" /></LinkButton> : <span />}
        </nav>
      )}
    </>
  );
}

export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pt-8">
      <section className="relative mb-4 overflow-hidden rounded-2xl bg-hero px-5 py-6 text-hero-fg">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-0 h-full w-24 -skew-x-[22deg] bg-accent/90" />
        <h1 className="relative text-2xl font-extrabold leading-tight sm:text-4xl"><T en="Premium" sw="Vipuri" /><br /><T en="Spare Parts" sw="Bora" /></h1>
        <p className="tagline relative mt-1 text-sm text-white/80"><T en="For Every Drive" sw="Kwa Kila Safari" /></p>
      </section>
      <p className="mb-4 mt-1 text-sm text-muted">
        <T en="Spare parts for cars and motorcycles. Prices in TSh are indicative and confirmed on WhatsApp. Ask us if you are not sure what fits." sw="Vipuri vya magari na pikipiki. Bei kwa TSh ni elekezi na zinathibitishwa kwa WhatsApp. Tuulize ukiwa huna uhakika kinachofaa." />
      </p>
      <Suspense fallback={<div className="h-40 rounded-2xl bg-surface-2" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
