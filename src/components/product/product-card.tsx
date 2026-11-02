import Link from "next/link";
import { ImageOff } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { QuickAdd } from "@/components/cart/quick-add";
import { classificationLabel, type Classification, type ProductSummary } from "@/lib/catalog/queries";

export function ImagePlaceholder({ className, label = "No photo yet" }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-2 text-muted", className)}>
      <ImageOff className="h-8 w-8" aria-hidden="true" />
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}

/** Product photo. A plain <img> because photos come from many admin-approved sources. */
export function ProductImage({ src, alt, className, eager = false }: { src: string | null; alt: string; className?: string; eager?: boolean }) {
  if (!src) return <ImagePlaceholder />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className={cn("h-full w-full bg-white object-contain", className)} />;
}

const classStyles: Record<Classification, string> = {
  genuine_oem: "bg-accent text-accent-fg",
  oem_equivalent: "border border-accent text-accent-text",
  aftermarket: "border border-border text-muted",
  unverified: "border border-dashed border-border text-muted",
};

export function ClassificationBadge({ value }: { value: Classification }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", classStyles[value])}>
      {classificationLabel[value]}
    </span>
  );
}

/** Availability only: customers never see exact quantities. */
export function StockStatus({ inStock }: { inStock: boolean }) {
  return inStock ? (
    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">In stock</span>
  ) : (
    <span className="text-xs font-semibold text-red-600 dark:text-red-400">Out of stock</span>
  );
}

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="aspect-square overflow-hidden">
          <ProductImage src={product.imageUrl} alt={product.name} className="transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3 pt-3 sm:px-4">
          {product.classification !== "unverified" && <ClassificationBadge value={product.classification} />}
          <h3 className="font-display text-sm font-bold leading-snug group-hover:text-accent-text">{product.name}</h3>
          <p className="text-xs text-zinc-500">{product.partNumber ? `Part no. ${product.partNumber}` : `SKU ${product.sku}`}</p>
        </div>
      </Link>
      <div className="flex flex-col gap-2 px-3 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:pb-4">
        <span className="font-display text-[15px] font-extrabold sm:text-base">{formatPrice(product.priceTzs)}</span>
        {product.priceTzs > 0 && (
          <QuickAdd
            product={{ productId: product.id, slug: product.slug, sku: product.sku, name: product.name, priceTzs: product.priceTzs, imageUrl: product.imageUrl }}
          />
        )}
      </div>
    </div>
  );
}
