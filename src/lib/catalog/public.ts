import "server-only";
import { asPublic } from "@/lib/db";
import { getProductBySlug, listBrands, listCategories, listProducts, logSearch, type ProductFilters } from "./queries";

export * from "./queries";

/** Server-side helpers that run under the restricted customer database role. */
export const publicProducts = (f: ProductFilters) => asPublic((db) => listProducts(db, f));
export const publicProduct = (slug: string) => asPublic((db) => getProductBySlug(db, slug));
export const publicCategories = () => asPublic((db) => listCategories(db));
export const publicBrands = () => asPublic((db) => listBrands(db));

export async function searchAndLog(f: ProductFilters, profileId?: string) {
  return asPublic(async (db) => {
    const page = await listProducts(db, f);
    if (f.q && (f.page ?? 1) === 1) await logSearch(db, f.q, page.total, profileId);
    return page;
  });
}
