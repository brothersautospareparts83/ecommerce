import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { categories, products } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Shop All Products" };

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Shop All Products</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Showing DEMO records for layout review. Search, filters and sorting arrive with the product catalog build.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-fg"
          >
            {c.name}
          </Link>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
