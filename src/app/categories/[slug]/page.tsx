import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { LinkButton } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/home/whatsapp-button";
import { categories as meta } from "@/lib/categories";
import { publicCategories, publicProducts } from "@/lib/catalog/public";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: meta.find((c) => c.slug === slug)?.name ?? "Category" };
}

async function Content({ params, searchParams }: Pick<PageProps<"/categories/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const sp = await searchParams;
  const cats = await publicCategories();
  const category = cats.find((c) => c.slug === slug);
  if (!category) notFound();
  const page = Math.max(1, parseInt(String(Array.isArray(sp.page) ? sp.page[0] : sp.page ?? "1"), 10) || 1);
  const result = await publicProducts({ category: slug, sort: "newest", page, pageSize: 24 });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/categories" className="hover:text-fg">Categories</Link> / <span className="text-fg">{category.name}</span>
      </nav>
      <h1 className="font-display text-3xl font-extrabold">{category.name}</h1>
      {result.items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold">No products are listed online in this category yet.</p>
          <p className="mt-1 text-sm text-muted">We may still have it in the shop. Ask us on WhatsApp.</p>
          <div className="mt-4"><WhatsAppButton /></div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {result.items.map((p) => (<ProductCard key={p.id} product={p} />))}
          </div>
          {result.pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
              {page > 1 ? <LinkButton href={`/categories/${slug}?page=${page - 1}`} variant="secondary" size="sm">← Previous</LinkButton> : <span />}
              <span className="text-sm text-muted">Page {page} of {result.pages}</span>
              {page < result.pages ? <LinkButton href={`/categories/${slug}?page=${page + 1}`} variant="secondary" size="sm">Next →</LinkButton> : <span />}
            </nav>
          )}
        </>
      )}
    </>
  );
}

export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-surface-2" />}>
        <Content params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
