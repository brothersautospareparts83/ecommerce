import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaff, staffSession } from "@/lib/auth/session";
import { withDb } from "@/lib/db";
import { ProductForm, emptyProduct } from "../product-form";

export const metadata: Metadata = { title: "New product (admin)" };

async function NewProduct() {
  const me = await requireStaff();
  const { categories, brands } = await withDb(staffSession(me), async (db) => ({
    categories: (await db.query("select id, name_en as name from categories where is_active order by sort_order")).rows as { id: string; name: string }[],
    brands: (await db.query("select id, name::text as name from brands where is_active order by name")).rows as { id: string; name: string }[],
  }));
  return (
    <div className="max-w-3xl">
      <p className="mb-2 text-sm text-muted"><Link href="/admin/products" className="hover:text-fg">Products</Link> / New</p>
      <h1 className="mb-6 font-display text-3xl font-extrabold">New product</h1>
      <ProductForm values={emptyProduct} categories={categories} brands={brands} />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProduct />
    </Suspense>
  );
}
