import { LinkButton } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/lib/catalog/queries";

/** Latest published products. Hidden entirely until there is something real to show. */
export function LatestProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-text">Popular parts</p>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Parts in the shop</h2>
        </div>
        <LinkButton href="/shop" variant="secondary" size="sm">View all <ArrowRight className="h-4 w-4" /></LinkButton>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {products.map((p) => (<ProductCard key={p.id} product={p} />))}
      </div>
    </section>
  );
}
