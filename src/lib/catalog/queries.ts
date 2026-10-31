import { normalizePartNumber } from "@/lib/slug";

/** Anything with a pg-style query method: a pooled client, a pg Client inside a test, etc. */
export interface Queryable {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
}

export type Classification = "genuine_oem" | "oem_equivalent" | "aftermarket" | "unverified";
export type Condition = "new" | "used" | "refurbished";

export const classificationLabel: Record<Classification, string> = {
  genuine_oem: "Genuine OEM",
  oem_equivalent: "OEM equivalent",
  aftermarket: "Aftermarket",
  unverified: "Not yet classified",
};
export const conditionLabel: Record<Condition, string> = { new: "New", used: "Used", refurbished: "Refurbished" };

export interface ProductSummary {
  id: string;
  slug: string;
  sku: string;
  name: string;
  priceTzs: number;
  classification: Classification;
  condition: Condition;
  brandName: string | null;
  partNumber: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  /** Availability only. Exact quantities are admin-only and never sent to customers. */
  inStock: boolean;
}

export type SortKey = "relevance" | "newest" | "price-asc" | "price-desc" | "name";

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  classification?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  items: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

const CLASSIFICATIONS = ["genuine_oem", "oem_equivalent", "aftermarket"];
/** SQL expression that escapes LIKE wildcards in a column/alias, so user text is matched literally. */
const LIKE_ESC = (col: string) => `replace(replace(replace(${col}, '\\', '\\\\'), '%', '\\%'), '_', '\\_')`;

/**
 * Search vocabulary: the typed text plus variants where a known term is swapped for its synonym
 * (English / Kiswahili / mechanic words from the search_synonyms table), in either direction.
 */
export async function expandSearchTerms(db: Queryable, rawQuery: string): Promise<string[]> {
  const q = rawQuery.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
  if (!q) return [];
  const terms = new Set([q]);
  const { rows } = await db.query("select term, synonym from search_synonyms");
  for (const r of rows) {
    const a = String(r.term).toLowerCase();
    const b = String(r.synonym).toLowerCase();
    if (q.includes(a)) terms.add(q.replace(a, b));
    if (q.includes(b)) terms.add(q.replace(b, a));
  }
  return [...terms].slice(0, 8);
}

const SORTS: Record<Exclude<SortKey, "relevance">, string> = {
  newest: "p.published_at desc nulls last, p.name",
  "price-asc": "p.price_tzs asc, p.name",
  "price-desc": "p.price_tzs desc, p.name",
  name: "p.name asc",
};

function toSummary(r: Record<string, unknown>): ProductSummary {
  return {
    id: String(r.id),
    slug: String(r.slug),
    sku: String(r.sku),
    name: String(r.name),
    priceTzs: Number(r.price_tzs),
    classification: r.classification as Classification,
    condition: r.condition as Condition,
    brandName: (r.brand_name as string) ?? null,
    partNumber: (r.part_number as string) ?? null,
    categorySlug: (r.category_slug as string) ?? null,
    categoryName: (r.category_name as string) ?? null,
    imageUrl: (r.image_url as string) ?? null,
    inStock: r.in_stock === true,
  };
}

const SELECT = `
  select p.id, p.slug, p.sku::text as sku, p.name, p.price_tzs, p.classification, p.condition, p.published_at,
         b.name::text as brand_name, c.slug as category_slug, c.name_en as category_name,
         (select o.part_number from oem_part_numbers o where o.product_id = p.id order by o.is_primary desc, o.part_number limit 1) as part_number,
         img.url as image_url, product_in_stock(p.id) as in_stock`;
const FROM = `
  from products p
  left join brands b on b.id = p.brand_id
  left join categories c on c.id = p.category_id
  left join lateral (
    select i.url from product_images i
    where i.product_id = p.id and i.verification_status = 'approved'
    order by (i.kind = 'illustrative'), i.is_primary desc, i.created_at limit 1
  ) img on true`;

/**
 * Public product search. Run it through a customer-role connection: Row Level Security then
 * guarantees only published products with approved photos are ever returned, and cost price
 * is not even selectable.
 */
export async function listProducts(db: Queryable, f: ProductFilters = {}): Promise<ProductPage> {
  const where: string[] = ["p.status = 'published'"];
  const params: unknown[] = [];
  const add = (v: unknown) => (params.push(v), `$${params.length}`);

  let rankExact = "false";
  let rankSim = "0";
  const q = f.q?.trim() ?? "";
  if (q) {
    const terms = await expandSearchTerms(db, q);
    const raw = add(terms);
    const norms = add([...new Set(terms.map(normalizePartNumber).filter((n) => n.length >= 3))]);
    where.push(`(
      exists (select 1 from unnest(${raw}::text[]) as rt(t)
              where exists (select 1 from regexp_split_to_table(rt.t, '\\s+') as w0 where length(w0) > 1)
                and not exists (
                  select 1 from regexp_split_to_table(rt.t, '\\s+') as w
                  where length(w) > 1 and not (
                    p.name ilike '%' || ${LIKE_ESC("w")} || '%'
                    or p.sku::text ilike '%' || ${LIKE_ESC("w")} || '%'
                    or coalesce(p.description, '') ilike '%' || ${LIKE_ESC("w")} || '%'
                    or word_similarity(w, p.name) >= 0.5
                  )
                ))
      or exists (select 1 from oem_part_numbers o, unnest(${norms}::text[]) as n(x)
                 where o.product_id = p.id and (o.normalized like n.x || '%' or (length(n.x) >= 4 and o.normalized like '%' || n.x || '%')))
      or exists (select 1 from oem_part_numbers o join part_cross_references xr on xr.oem_part_id = o.id, unnest(${norms}::text[]) as n(x)
                 where o.product_id = p.id and xr.cross_normalized like n.x || '%')
    )`);
    rankExact = `(p.sku::text ilike any(${raw}::text[]) or exists (select 1 from oem_part_numbers o where o.product_id = p.id and o.normalized = any(${norms}::text[])))`;
    rankSim = `coalesce((select max(similarity(p.name, t)) from unnest(${raw}::text[]) as t), 0)`;
  }
  if (f.category) where.push(`c.slug = ${add(f.category)}`);
  if (f.brand) where.push(`b.slug = ${add(f.brand)}`);
  if (f.classification && CLASSIFICATIONS.includes(f.classification)) where.push(`p.classification = ${add(f.classification)}::product_classification`);
  if (f.inStock) where.push("product_in_stock(p.id)");
  if (Number.isFinite(f.minPrice)) where.push(`p.price_tzs >= ${add(Math.max(0, Math.floor(f.minPrice!)))}`);
  if (Number.isFinite(f.maxPrice)) where.push(`p.price_tzs <= ${add(Math.max(0, Math.floor(f.maxPrice!)))}`);

  const sort: SortKey = f.sort ?? (q ? "relevance" : "newest");
  const order = sort === "relevance" ? `rank_exact desc, rank_sim desc, p.published_at desc nulls last` : SORTS[sort];
  const pageSize = Math.min(Math.max(f.pageSize ?? 24, 1), 48);
  const page = Math.max(Math.floor(f.page ?? 1), 1);

  const sql = `${SELECT}, ${rankExact} as rank_exact, ${rankSim} as rank_sim, count(*) over() as total
    ${FROM}
    where ${where.join(" and ")}
    order by ${order}
    limit ${pageSize} offset ${(page - 1) * pageSize}`;
  const { rows } = await db.query(sql, params);
  const total = rows.length ? Number(rows[0].total) : 0;
  return { items: rows.map(toSummary), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  weightKg: number | null;
  images: { id: string; url: string; kind: string; sourceName: string | null; attribution: string | null }[];
  partNumbers: { number: string; isPrimary: boolean; isAlternative: boolean }[];
  compatibility: { make: string; model: string; generation: string; yearFrom: number | null; yearTo: number | null; engine: string | null; position: string; notes: string | null }[];
}

export async function getProductBySlug(db: Queryable, slug: string): Promise<ProductDetail | null> {
  const { rows } = await db.query(
    `${SELECT}, p.description, p.weight_kg ${FROM} where p.slug = $1 and p.status = 'published'`,
    [slug],
  );
  if (!rows[0]) return null;
  const base = toSummary(rows[0]);
  const id = base.id;
  const [imgs, oem, compat] = await Promise.all([
    db.query(
      `select id, url, kind, source_name, attribution from product_images
       where product_id = $1 and verification_status = 'approved'
       order by (kind = 'illustrative'), is_primary desc, created_at`,
      [id],
    ),
    db.query("select part_number, is_primary, is_alternative from oem_part_numbers where product_id = $1 order by is_primary desc, part_number", [id]),
    db.query(
      `select m.name::text as make, vm.name::text as model, vg.name as generation, v.year_from, v.year_to,
              e.code::text as engine, vc.position, vc.fitment_notes
       from vehicle_compatibility vc
       join vehicles v on v.id = vc.vehicle_id
       join vehicle_generations vg on vg.id = v.generation_id
       join vehicle_models vm on vm.id = vg.model_id
       join manufacturers m on m.id = vm.manufacturer_id
       left join vehicle_engines e on e.id = v.engine_id
       where vc.product_id = $1 order by m.name, vm.name, v.year_from`,
      [id],
    ),
  ]);
  return {
    ...base,
    description: (rows[0].description as string) ?? null,
    weightKg: rows[0].weight_kg == null ? null : Number(rows[0].weight_kg),
    images: imgs.rows.map((r) => ({ id: String(r.id), url: String(r.url), kind: String(r.kind), sourceName: (r.source_name as string) ?? null, attribution: (r.attribution as string) ?? null })),
    partNumbers: oem.rows.map((r) => ({ number: String(r.part_number), isPrimary: Boolean(r.is_primary), isAlternative: Boolean(r.is_alternative) })),
    compatibility: compat.rows.map((r) => ({
      make: String(r.make), model: String(r.model), generation: String(r.generation),
      yearFrom: r.year_from == null ? null : Number(r.year_from), yearTo: r.year_to == null ? null : Number(r.year_to),
      engine: (r.engine as string) ?? null, position: String(r.position ?? ""), notes: (r.fitment_notes as string) ?? null,
    })),
  };
}

export interface CategoryWithCount {
  slug: string;
  name: string;
  count: number;
}

export async function listCategories(db: Queryable): Promise<CategoryWithCount[]> {
  const { rows } = await db.query(
    `select c.slug, c.name_en as name,
            (select count(*)::int from products p where p.category_id = c.id and p.status = 'published') as count
     from categories c where c.is_active order by c.sort_order, c.name_en`,
  );
  return rows.map((r) => ({ slug: String(r.slug), name: String(r.name), count: Number(r.count) }));
}

export async function listBrands(db: Queryable): Promise<{ slug: string; name: string }[]> {
  const { rows } = await db.query(
    `select b.slug, b.name::text as name from brands b
     where b.is_active and exists (select 1 from products p where p.brand_id = b.id and p.status = 'published')
     order by b.name`,
  );
  return rows.map((r) => ({ slug: String(r.slug), name: String(r.name) }));
}

/** Records what customers search for, including searches with no results (used for restocking insight). */
export async function logSearch(db: Queryable, query: string, resultCount: number, profileId?: string) {
  const q = query.trim().slice(0, 120);
  if (!q) return;
  await db.query("insert into search_queries (query, mode, result_count, profile_id) values ($1, 'name', $2, $3)", [q, resultCount, profileId ?? null]);
}
