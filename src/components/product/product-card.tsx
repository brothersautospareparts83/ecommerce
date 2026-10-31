import Link from "next/link";
import { ImageOff } from "lucide-react";
import { cn, formatTZS } from "@/lib/utils";
import type { Classification, Product } from "@/lib/demo-data";

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 text-muted",
        className,
      )}
    >
      <ImageOff className="h-8 w-8" aria-hidden="true" />
      <span className="text-[11px] font-bold uppercase tracking-widest">Image required</span>
    </div>
  );
}

const classStyles: Record<Classification, string> = {
  "Genuine OEM": "bg-accent text-accent-fg",
  "OEM equivalent": "border border-accent text-accent-text",
  Aftermarket: "border border-border text-muted",
};

export function ClassificationBadge({ value }: { value: Classification }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", classStyles[value])}>
      {value}
    </span>
  );
}

export function StockStatus({ stock, min }: { stock: number; min: number }) {
  if (stock <= 0) return <span className="text-xs font-semibold text-red-600 dark:text-red-400">Out of stock</span>;
  if (stock <= min) return <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Low stock</span>;
  return <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">In stock</span>;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent"
    >
      <div className="relative aspect-square overflow-hidden">
        <ImagePlaceholder />
        {product.isDemo && (
          <span className="absolute left-2 top-2 rounded bg-hero px-2 py-0.5 text-[10px] font-bold tracking-widest text-hero-fg">
            DEMO
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <ClassificationBadge value={product.classification} />
        <h3 className="font-display text-sm font-bold leading-snug group-hover:text-accent-text">{product.name}</h3>
        <p className="text-xs text-muted">{product.brand} · SKU {product.sku}</p>
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="font-display text-base font-extrabold">{formatTZS(product.price)}</span>
          <StockStatus stock={product.stock} min={product.minStock} />
        </div>
      </div>
    </Link>
  );
}
