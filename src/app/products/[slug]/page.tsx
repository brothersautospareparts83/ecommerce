import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { AddToCart } from "@/components/cart/add-to-cart";
import { ClassificationBadge, ProductCard, ProductImage, StockStatus } from "@/components/product/product-card";
import { conditionLabel, publicProduct, publicProducts } from "@/lib/catalog/public";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await publicProduct(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: `${p.name}${p.partNumber ? ` (part no. ${p.partNumber})` : ""} at Brothers Auto Spare Parts, Kariakoo. ${p.priceTzs > 0 ? `${formatPrice(p.priceTzs)}.` : ""}`,
    openGraph: p.imageUrl ? { images: [p.imageUrl] } : undefined,
  };
}

async function Product({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  const p = await publicProduct(slug);
  if (!p) notFound();
  const related = p.categorySlug ? (await publicProducts({ category: p.categorySlug, sort: "newest", pageSize: 5 })).items.filter((r) => r.id !== p.id).slice(0, 4) : [];

  const specs: [string, string][] = [
    ["SKU", p.sku],
    ...(p.partNumber ? [["Part number", p.partNumber] as [string, string]] : []),
    ...(p.brandName ? [["Brand", p.brandName] as [string, string]] : []),
    ...(p.categoryName ? [["Category", p.categoryName] as [string, string]] : []),
    ["Condition", conditionLabel[p.condition]],
    ...(p.weightKg != null ? [["Weight", `${p.weightKg} kg`] as [string, string]] : []),
  ];
  const altNumbers = p.partNumbers.filter((n) => !n.isPrimary && n.number !== p.partNumber);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    ...(p.partNumber ? { mpn: p.partNumber } : {}),
    ...(p.imageUrl ? { image: p.imageUrl } : {}),
    ...(p.brandName ? { brand: { "@type": "Brand", name: p.brandName } } : {}),
    ...(p.priceTzs > 0 ? { offers: {
      "@type": "Offer",
      priceCurrency: "TZS",
      price: p.priceTzs,
      itemCondition: p.condition === "new" ? "https://schema.org/NewCondition" : p.condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/RefurbishedCondition",
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-fg">Shop</Link> /{" "}
        {p.categorySlug && (<><Link href={`/categories/${p.categorySlug}`} className="hover:text-fg">{p.categoryName}</Link> / </>)}
        <span className="text-fg">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-3 self-start">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border sm:aspect-square">
            <ProductImage src={p.images[0]?.url ?? p.imageUrl} alt={p.name} />
          </div>
          {p.images.length > 1 && (
            <ul className="grid grid-cols-4 gap-2">
              {p.images.slice(0, 8).map((img) => (
                <li key={img.id} className="aspect-square overflow-hidden rounded-lg border border-border">
                  <ProductImage src={img.url} alt={`${p.name} photo`} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {p.classification !== "unverified" && <div className="mb-3"><ClassificationBadge value={p.classification} /></div>}
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{p.name}</h1>
          <p className="mt-4 font-display text-3xl font-extrabold">{formatPrice(p.priceTzs)}</p>
          <div className="mt-2"><StockStatus inStock={p.inStock} /></div>

          {p.description && <p className="mt-5 text-sm leading-relaxed text-muted">{p.description}</p>}

          {p.compatibility.length > 0 ? (
            <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4 text-sm">
              <p className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-accent-text" /> Verified to fit</p>
              <ul className="space-y-1 text-muted">
                {p.compatibility.map((c, i) => (
                  <li key={i}>
                    {c.make} {c.model} {c.generation}
                    {c.yearFrom ? ` (${c.yearFrom}${c.yearTo ? `–${c.yearTo}` : "+"})` : ""}
                    {c.engine ? `, engine ${c.engine}` : ""}{c.position ? `, ${c.position}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-4 text-sm">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" />
              <p className="text-muted">
                <span className="font-semibold text-fg">Check fitment before you buy.</span> We only list a vehicle as compatible once it is verified.
                Send us your vehicle details or chassis number and we will confirm.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <AddToCart product={{ productId: p.id, slug: p.slug, sku: p.sku, name: p.name, priceTzs: p.priceTzs, imageUrl: p.images[0]?.url ?? p.imageUrl }} />
            <WhatsAppButton label="Order on WhatsApp" message={`Hello, I would like to order: ${p.name}${p.partNumber ? ` (part no. ${p.partNumber})` : ""}, SKU ${p.sku}.`} />
          </div>

          <dl className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
            {altNumbers.length > 0 && (
              <div className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">Other part numbers</dt>
                <dd className="text-right font-semibold">{altNumbers.map((n) => n.number).join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-extrabold">More in {p.categoryName}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((r) => (<ProductCard key={r.id} product={r} />))}
          </div>
        </section>
      )}
    </>
  );
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface-2" />}>
        <Product params={props.params} />
      </Suspense>
    </div>
  );
}
