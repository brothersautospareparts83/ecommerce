import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { getProductBySlug, listCategories, listProducts, expandSearchTerms, type ProductFilters } from "@/lib/catalog/queries";

// Runs against the real database inside a transaction that is rolled back after every test.
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
beforeAll(() => client.connect());
afterAll(() => client.end());

const ids: Record<string, string> = {};

async function product(sku: string, name: string, price: number, cls: string, cat: string, brandId: string, stock: number, status = "published") {
  const catId = (await client.query("select id from categories where slug = $1", [cat])).rows[0].id;
  const id = (
    await client.query(
      `insert into products (sku, slug, name, classification, price_tzs, cost_price_tzs, category_id, brand_id, description)
       values ($1::text, lower($1::text), $2, $3, $4, 1, $5, $6, 'Test description') returning id`,
      [sku, name, cls, price, catId, brandId],
    )
  ).rows[0].id;
  await client.query(
    "insert into product_images (product_id, storage_path, url, kind, is_primary, verification_status) values ($1, 'x', 'https://example.test/' || $2::text || '.jpg', 'own_photo', true, 'approved')",
    [id, sku],
  );
  if (stock) await client.query("insert into inventory_movements (product_id, quantity_delta, reason) values ($1, $2, 'opening_stock')", [id, stock]);
  if (status === "published") await client.query("update products set status = 'published' where id = $1", [id]);
  ids[sku] = id;
  return id;
}

beforeEach(async () => {
  await client.query("begin");
  const brandId = (await client.query("insert into brands (name, slug) values ('TestBrand', 'testbrand') returning id")).rows[0].id;
  const brand2 = (await client.query("insert into brands (name, slug) values ('OtherBrand', 'otherbrand') returning id")).rows[0].id;
  const a = await product("T-BP-001", "Front Brake Pad Set", 65000, "aftermarket", "brake-systems", brandId, 10);
  await product("T-OF-002", "Engine Oil Filter", 18000, "oem_equivalent", "oil-filters", brand2, 0);
  await product("T-AF-003", "Cabin Air Filter", 22000, "aftermarket", "air-filters", brandId, 5);
  await product("T-HD-004", "Hidden Brake Disc", 99000, "genuine_oem", "brake-systems", brandId, 3, "draft");

  const o1 = (await client.query("insert into oem_part_numbers (product_id, part_number, is_primary) values ($1, '04465-0K240', true) returning id", [a])).rows[0].id;
  await client.query("insert into oem_part_numbers (product_id, part_number, is_alternative) values ($1, '0446548100', true)", [a]);
  await client.query("insert into part_cross_references (oem_part_id, cross_number, relation, verified) values ($1, 'BP-XYZ-77', 'equivalent', true)", [o1]);
  await client.query("insert into part_cross_references (oem_part_id, cross_number, relation, verified) values ($1, 'SECRET-99', 'alternative', false)", [o1]);

  // verified and unverified compatibility
  const make = (await client.query("select id from manufacturers where slug = 'toyota'")).rows[0].id;
  const model = (await client.query("insert into vehicle_models (manufacturer_id, name, slug) values ($1, 'TestModel', 'testmodel') returning id", [make])).rows[0].id;
  const gen = (await client.query("insert into vehicle_generations (model_id, name, year_from, year_to) values ($1, 'G1', 2010, 2015) returning id", [model])).rows[0].id;
  const veh1 = (await client.query("insert into vehicles (generation_id, year_from, year_to) values ($1, 2010, 2015) returning id", [gen])).rows[0].id;
  const veh2 = (await client.query("insert into vehicles (generation_id, year_from, year_to) values ($1, 2016, 2018) returning id", [gen])).rows[0].id;
  await client.query("insert into vehicle_compatibility (product_id, vehicle_id, verified, verified_at) values ($1, $2, true, now())", [a, veh1]);
  await client.query("insert into vehicle_compatibility (product_id, vehicle_id, verified) values ($1, $2, false)", [a, veh2]);

  await client.query("set local role app_customer");
});
afterEach(() => client.query("rollback"));

const search = (f: ProductFilters) => listProducts(client, f);
const skus = (r: { items: { sku: string }[] }) => r.items.map((i) => i.sku).sort();

describe("public visibility", () => {
  it("returns only published products and never exposes cost price", async () => {
    const r = await search({});
    expect(skus(r)).toEqual(["T-AF-003", "T-BP-001", "T-OF-002"]);
    expect(JSON.stringify(r.items[0])).not.toMatch(/cost/i);
    expect(r.items.every((p) => p.imageUrl?.startsWith("https://example.test/"))).toBe(true);
  });

  it("does not return a draft product even for an exact SKU or OEM-like search", async () => {
    expect((await search({ q: "T-HD-004" })).total).toBe(0);
    expect((await getProductBySlug(client, "t-hd-004"))).toBeNull();
  });

  it("reports availability from stock", async () => {
    const r = await search({});
    const by = Object.fromEntries(r.items.map((p) => [p.sku, p.inStock]));
    expect(by).toEqual({ "T-BP-001": true, "T-OF-002": false, "T-AF-003": true });
  });
});

describe("part number search", () => {
  it.each([
    ["exact OEM", "04465-0K240"],
    ["OEM without punctuation", "044650K240"],
    ["OEM lower case with space", "04465 0k240"],
    ["partial OEM prefix", "04465"],
    ["partial OEM middle", "650K2"],
    ["alternative part number", "0446548100"],
    ["verified cross reference", "BP-XYZ-77"],
    ["SKU", "t-bp-001"],
  ])("finds the brake pads by %s", async (_label, q) => {
    expect(skus(await search({ q }))).toEqual(["T-BP-001"]);
  });

  it("ignores unverified cross references", async () => {
    expect((await search({ q: "SECRET99" })).total).toBe(0);
  });

  it("ranks an exact SKU/OEM match first", async () => {
    const r = await search({ q: "T-AF-003" });
    expect(r.items[0].sku).toBe("T-AF-003");
  });
});

describe("name search: English, Kiswahili, typos", () => {
  it("finds by English name and partial words", async () => {
    expect(skus(await search({ q: "brake pads" }))).toEqual(["T-BP-001"]);
    expect(skus(await search({ q: "filter" }))).toEqual(["T-AF-003", "T-OF-002"]);
  });

  it("understands Kiswahili / mechanic words through synonyms", async () => {
    expect(skus(await search({ q: "breki" }))).toEqual(["T-BP-001"]);
    expect(skus(await search({ q: "breki pads" }))).toEqual(["T-BP-001"]);
    expect(skus(await search({ q: "chujio la oil" }))).toEqual(["T-OF-002"]);
    expect(skus(await search({ q: "chujio la hewa" }))).toEqual(["T-AF-003"]);
  });

  it("tolerates typing mistakes", async () => {
    expect(skus(await search({ q: "brak pads" }))).toContain("T-BP-001");
    expect(skus(await search({ q: "brake pad" }))).toContain("T-BP-001");
  });

  it("treats wildcard and injection characters as plain text", async () => {
    expect((await search({ q: "%" })).total).toBe(0);
    expect((await search({ q: "_" })).total).toBe(0);
    expect((await search({ q: "'; drop table products; --" })).total).toBe(0);
    expect((await search({})).total).toBe(3);
  });

  it("expands synonyms in both directions", async () => {
    expect(await expandSearchTerms(client, "breki")).toContain("brake");
    expect(await expandSearchTerms(client, "air filter")).toContain("chujio la hewa");
  });
});

describe("filters, sorting and pagination", () => {
  it("filters by category, brand, classification, stock and price", async () => {
    expect(skus(await search({ category: "oil-filters" }))).toEqual(["T-OF-002"]);
    expect(skus(await search({ brand: "otherbrand" }))).toEqual(["T-OF-002"]);
    expect(skus(await search({ classification: "aftermarket" }))).toEqual(["T-AF-003", "T-BP-001"]);
    expect(skus(await search({ inStock: true }))).toEqual(["T-AF-003", "T-BP-001"]);
    expect(skus(await search({ minPrice: 20000, maxPrice: 70000 }))).toEqual(["T-AF-003", "T-BP-001"]);
  });

  it("ignores unknown classification values instead of failing", async () => {
    expect((await search({ classification: "bogus" })).total).toBe(3);
  });

  it("sorts by price and name", async () => {
    expect((await search({ sort: "price-asc" })).items.map((i) => i.sku)).toEqual(["T-OF-002", "T-AF-003", "T-BP-001"]);
    expect((await search({ sort: "price-desc" })).items.map((i) => i.sku)).toEqual(["T-BP-001", "T-AF-003", "T-OF-002"]);
    expect((await search({ sort: "name" })).items.map((i) => i.name)).toEqual(["Cabin Air Filter", "Engine Oil Filter", "Front Brake Pad Set"]);
  });

  it("paginates and reports totals", async () => {
    const p1 = await search({ sort: "price-asc", pageSize: 2, page: 1 });
    const p2 = await search({ sort: "price-asc", pageSize: 2, page: 2 });
    expect([p1.total, p1.pages, p1.items.length, p2.items.length]).toEqual([3, 2, 2, 1]);
    expect(p2.items[0].sku).toBe("T-BP-001");
  });
});

describe("product page and categories", () => {
  it("returns the product with photos, part numbers and only verified compatibility", async () => {
    const p = await getProductBySlug(client, "t-bp-001");
    expect(p?.name).toBe("Front Brake Pad Set");
    expect(p?.images).toHaveLength(1);
    expect(p?.partNumbers.map((n) => n.number)).toEqual(["04465-0K240", "0446548100"]);
    expect(p?.compatibility).toHaveLength(1);
    expect(p?.compatibility[0]).toMatchObject({ make: "Toyota", model: "TestModel", yearFrom: 2010, yearTo: 2015 });
  });

  it("counts only published products per category", async () => {
    const cats = Object.fromEntries((await listCategories(client)).map((c) => [c.slug, c.count]));
    expect(cats["brake-systems"]).toBe(1);
    expect(cats["oil-filters"]).toBe(1);
    expect(cats["body-parts"]).toBe(0);
  });
});
