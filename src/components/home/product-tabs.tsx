"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export interface ProductTab {
  id: string;
  label: string;
  products: Product[];
}

export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active)!;
  return (
    <div>
      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
              active === t.id ? "border-accent bg-accent text-accent-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {current.products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}
