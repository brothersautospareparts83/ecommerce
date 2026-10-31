import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { ClassificationBadge, ImagePlaceholder, StockStatus } from "@/components/product/product-card";
import { getCategory, getProduct, products } from "@/lib/demo-data";
import { formatTZS } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.categorySlug);

  const specs: [string, string][] = [
    ["SKU", product.sku],
    ["OEM part number", "Not provided"],
    ["Brand", product.brand],
    ["Category", category?.name ?? "-"],
    ["Condition", product.condition],
    ["Classification", product.classification],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-fg">Shop</Link> /{" "}
        {category && (<><Link href={`/categories/${category.slug}`} className="hover:text-fg">{category.name}</Link> / </>)}
        <span className="text-fg">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="self-start overflow-hidden rounded-2xl border border-border">
          <div className="aspect-square">
            <ImagePlaceholder />
          </div>
        </div>

        <div>
          <p className="mb-3 inline-block rounded bg-hero px-2 py-0.5 text-[10px] font-bold tracking-widest text-hero-fg">
            DEMO RECORD
          </p>
          <div className="mb-3"><ClassificationBadge value={product.classification} /></div>
          <h1 className="font-display text-3xl font-extrabold">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-extrabold">{formatTZS(product.price)}</p>
          <div className="mt-2"><StockStatus stock={product.stock} min={product.minStock} /></div>

          <p className="mt-6 text-muted">{product.description}</p>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-4 text-sm">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" />
            <p className="text-muted">
              <span className="font-semibold text-fg">Compatibility not yet verified.</span> Fitment is shown only from
              verified catalog records. Contact us to confirm this part for your vehicle.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" disabled title="Cart arrives in a later phase">Add to Cart</Button>
            <WhatsAppButton
              label="Ask on WhatsApp"
              message={`Hello, I am interested in: ${product.name} (SKU ${product.sku}).`}
            />
          </div>

          <dl className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
