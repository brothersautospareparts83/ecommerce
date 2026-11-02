import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { categories as meta } from "@/lib/categories";
import { publicCategories } from "@/lib/catalog/public";

export const metadata: Metadata = { title: "Product Categories" };

async function Grid() {
  const cats = await publicCategories();
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cats.map(({ slug, name, count }) => {
        const Icon = meta.find((m) => m.slug === slug)?.icon;
        return (
          <Link
            key={slug}
            href={`/categories/${slug}`}
            className="group rounded-2xl border border-border bg-surface shadow-card p-5 "
          >
            {Icon && (
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-accent-text group-hover:bg-accent group-hover:text-accent-fg">
                <Icon className="h-6 w-6" />
              </span>
            )}
            <h2 className="font-display text-sm font-bold">{name}</h2>
            {count > 0 && <p className="mt-1 text-xs text-muted">{count} {count === 1 ? "product" : "products"}</p>}
          </Link>
        );
      })}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-5 sm:pt-8">
      <h1 className="text-3xl font-extrabold">Product Categories</h1>
      <Suspense fallback={<div className="mt-8 h-40 rounded-xl bg-surface-2" />}>
        <Grid />
      </Suspense>
    </div>
  );
}
