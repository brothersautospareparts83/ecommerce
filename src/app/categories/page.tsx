import type { Metadata } from "next";
import Link from "next/link";
import { categories, productsInCategory } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Product Categories" };

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">Product Categories</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map(({ slug, name, icon: Icon }) => (
          <Link
            key={slug}
            href={`/categories/${slug}`}
            className="group rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-card"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-accent-text group-hover:bg-accent group-hover:text-accent-fg">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="font-display text-sm font-bold">{name}</h2>
            <p className="mt-1 text-xs text-muted">{productsInCategory(slug).length} demo items</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
